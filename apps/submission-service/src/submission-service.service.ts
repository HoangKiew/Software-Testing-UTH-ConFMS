import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Submission } from './modules/submission/entities/submission.entity';
import { SubmissionFile } from './modules/submission/entities/submission-file.entity';
import { SubmissionAuthor } from './modules/submission/entities/author.entity';
import { AuditTrail } from './modules/submission/entities/audit-trail.entity';
import { ConferenceClient } from './modules/integration/conference.client';
import { ReviewClient } from './modules/integration/review.client';
import { SubmissionStatus } from './shared/constants/submission-status.enum';

@Injectable()
export class SubmissionServiceService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(Submission) private subRepo: Repository<Submission>,
    @InjectRepository(SubmissionFile) private fileRepo: Repository<SubmissionFile>,
    @InjectRepository(SubmissionAuthor) private authorRepo: Repository<SubmissionAuthor>,
    @InjectRepository(AuditTrail) private auditRepo: Repository<AuditTrail>,
    private conferenceClient: ConferenceClient,
    private reviewClient: ReviewClient,
  ) { }

  onModuleInit() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // --- API 1: LẤY DANH SÁCH BÀI NỘP THEO USER ---
  async getSubmissionsByUser(userId: number) {
    try {
      const submissions = await this.subRepo.find({
        where: { created_by: userId },
        relations: ['files', 'authors'],
        order: { id: 'DESC' }
      });

      if (!submissions || submissions.length === 0) {
        // Trả về rỗng thay vì lỗi để FE dễ xử lý
        return { status: 'success', data: [] };
      }

      return {
        status: 'success',
        data: submissions
      };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi hệ thống khi lấy danh sách bài nộp');
    }
  }

  // --- API: LẤY DANH SÁCH TẤT CẢ BÀI NỘP VỚI PHÂN TRANG & LỌC (CHAIR) ---
  async findAllWithPagination(query: any) {
    const { page, limit, status, conferenceId, createdFrom, createdTo, search, sortBy, order } = query;

    const qb = this.subRepo.createQueryBuilder('submission')
      .leftJoinAndSelect('submission.authors', 'authors')
      .leftJoinAndSelect('submission.files', 'files');

    // Apply filters
    if (status) {
      qb.andWhere('submission.status = :status', { status });
    }

    if (conferenceId) {
      qb.andWhere('submission.conference_id = :conferenceId', { conferenceId });
    }

    // Date range with timezone handling
    if (createdFrom) {
      qb.andWhere('submission.created_at >= :createdFrom', {
        createdFrom: new Date(createdFrom)
      });
    }

    if (createdTo) {
      // Add 1 day to include the entire end date (23:59:59)
      const endDate = new Date(createdTo);
      endDate.setDate(endDate.getDate() + 1);
      qb.andWhere('submission.created_at < :createdTo', {
        createdTo: endDate
      });
    }

    // Search with ILIKE (case-insensitive)
    if (search) {
      qb.andWhere('submission.title ILIKE :search', {
        search: `%${search}%`
      });
    }

    // Map camelCase to snake_case for sorting
    const sortFieldMap = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'title': 'title'
    };
    const dbSortField = sortFieldMap[sortBy] || 'created_at';

    // Apply sorting
    qb.orderBy(`submission.${dbSortField}`, order);

    // Get total count first
    const total = await qb.getCount();

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    // Validate page number
    const validPage = Math.max(1, Math.min(page, totalPages || 1));

    // Apply pagination
    const skip = (validPage - 1) * limit;
    qb.skip(skip).take(limit);

    const data = await qb.getMany();

    return {
      data,
      pagination: {
        page: validPage,
        limit,
        total,
        totalPages: totalPages || 0,
        hasNext: validPage < totalPages,
        hasPrev: validPage > 1
      }
    };
  }

  // --- API 2: XỬ LÝ NỘP BÀI ---
  async handleSubmission(
    file: Express.Multer.File,
    dto: any,
    userId: number,
    userEmail: string,
    userName: string
  ) {
    try {
      // 0. Check Deadline
      await this.conferenceClient.checkDeadline(dto.conferenceId);

      // 1. Kiểm tra/Tạo Submission
      // Logic: Nếu cùng user, cùng title -> tính là version mới của submission cũ?
      // Hay luôn tạo mới? Theo user request: "Check Deadline trước khi cho phép lưu DB".
      // Giả sử logic là tạo mới hoặc update. Ở đây code cũ dùng findOne title + created_by.

      // 1. Tạo submission mới
      const sub = this.subRepo.create({
        title: dto.title,
        conference_id: dto.conferenceId,
        created_by: userId,
        abstract: dto.abstract || '',
        status: SubmissionStatus.SUBMITTED
      });
      await this.subRepo.save(sub);

      // 2. Tạo tác giả chính (tự động từ JWT)
      const primaryAuthor = this.authorRepo.create({
        submission_id: sub.id,
        author_name: userName,
        email: userEmail,
        is_corresponding: true
      });
      await this.authorRepo.save(primaryAuthor);

      // 3. Parse và tạo đồng tác giả
      if (dto.coAuthors) {
        const coAuthorEmails = dto.coAuthors
          .split(',')
          .map((email: string) => email.trim())
          .filter((email: string) => this.isValidEmail(email));

        for (const email of coAuthorEmails) {
          const coAuthor = this.authorRepo.create({
            submission_id: sub.id,
            author_name: email.split('@')[0],
            email: email,
            is_corresponding: false
          });
          await this.authorRepo.save(coAuthor);
        }
      }

      // Audit
      await this.logAudit('CREATE', 'SUBMISSION', sub.id, userId, 'Created new submission');

      // 2. Tính Version
      const version = await this.getNextVersion(sub.id);

      // 3. Chuẩn bị đường dẫn
      const fileExt = file.originalname.split('.').pop();
      const fileName = `v${version}.${fileExt}`;
      const path = `papers/${sub.id}/${fileName}`;

      // 4. Upload Supabase
      const { error: uploadError } = await this.supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME || 'submission')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        throw new BadRequestException(`Lỗi Cloud Storage: ${uploadError.message}`);
      }

      // 5. Lấy URL công khai
      const { data: { publicUrl } } = this.supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME || 'submission')
        .getPublicUrl(path);

      // 6. Lưu vào Database
      const savedFile = await this.fileRepo.save({
        submission_id: sub.id,
        file_path: publicUrl,
        version: version
      });

      // Audit File
      await this.logAudit('UPLOAD', 'FILE', savedFile.id, userId, `Uploaded version ${version}`);

      // Notify Review Service
      const allAuthors = await this.authorRepo.find({ where: { submission_id: sub.id } });
      await this.reviewClient.notifyNewSubmission(
        sub.id,
        sub.title,
        sub.conference_id,
        allAuthors
      );

      return {
        status: 'success',
        message: `Đã lưu bài nộp và file phiên bản v${version} thành công`,
        data: {
          submissionId: sub.id,
          fileId: savedFile.id,
          version: version,
          url: publicUrl
        }
      };

    } catch (error) {
      console.error('Submission Error:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message || 'Có lỗi xảy ra trong quá trình xử lý bài nộp.');
    }
  }

  private async getNextVersion(subId: number): Promise<number> {
    try {
      const count = await this.fileRepo.count({ where: { submission_id: subId } });
      return count + 1;
    } catch (e) {
      return 1;
    }
  }

  private async logAudit(action: string, type: string, entityId: number, actorId: number, details: string) {
    try {
      await this.auditRepo.save({
        action,
        entity_type: type,
        entity_id: entityId,
        actor_id: actorId,
        details: JSON.stringify({ message: details })
      });
    } catch (e) {
      console.error('Audit Log Failed:', e); // Không chặn flow chính
    }
  }

  // Helper cho controller gọi nếu cần
  async checkDeadline(confId: string) {
    return this.conferenceClient.checkDeadline(confId);
  }

  // --- API 3: LẤY CHI TIẾT MỘT SUBMISSION ---
  async getSubmissionById(id: number, userId: number, roles: string[]) {
    try {
      const submission = await this.subRepo.findOne({
        where: { id },
        relations: ['files', 'authors']
      });

      if (!submission) {
        throw new NotFoundException(`Không tìm thấy bài nộp với ID ${id}`);
      }

      // Author chỉ xem được bài của mình
      const isChair = roles?.includes('CHAIR');
      const isOwner = submission.created_by === userId;

      if (!isChair && !isOwner) {
        throw new ForbiddenException('Bạn không có quyền xem bài nộp này');
      }

      return {
        status: 'success',
        data: submission
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi lấy thông tin bài nộp');
    }
  }

  // --- API 4: LẤY DANH SÁCH SUBMISSIONS THEO CONFERENCE ---
  async getSubmissionsByConference(conferenceId: string) {
    try {
      const submissions = await this.subRepo.find({
        where: { conference_id: conferenceId },
        relations: ['files', 'authors'],
        order: { created_at: 'DESC' }
      });

      return {
        status: 'success',
        data: submissions,
        total: submissions.length
      };
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi lấy danh sách bài nộp theo hội nghị');
    }
  }

  // --- API 5: CẬP NHẬT TRẠNG THÁI SUBMISSION (CHAIR ONLY) ---
  async updateStatus(id: number, status: SubmissionStatus, comment: string, actorId: number) {
    try {
      const submission = await this.subRepo.findOne({ where: { id } });

      if (!submission) {
        throw new NotFoundException(`Không tìm thấy bài nộp với ID ${id}`);
      }

      const oldStatus = submission.status;
      submission.status = status;
      await this.subRepo.save(submission);

      // Audit log
      await this.logAudit(
        'UPDATE_STATUS',
        'SUBMISSION',
        id,
        actorId,
        `Changed status from ${oldStatus} to ${status}${comment ? ': ' + comment : ''}`
      );

      // Notify Review Service
      await this.reviewClient.notifyStatusChange(id, status, comment);

      return {
        status: 'success',
        message: `Đã cập nhật trạng thái thành ${status}`,
        data: submission
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi cập nhật trạng thái');
    }
  }

  // --- API 6: UPDATE SUBMISSION METADATA (AUTHOR ONLY) ---
  async updateSubmission(id: number, userId: number, updateData: any) {
    try {
      const submission = await this.subRepo.findOne({
        where: { id },
        relations: ['authors']
      });

      if (!submission) {
        throw new NotFoundException(`Không tìm thấy bài nộp với ID ${id}`);
      }

      // Kiểm tra ownership
      if (submission.created_by !== userId) {
        throw new ForbiddenException('Bạn chỉ có thể sửa bài nộp của mình');
      }

      // Không cho phép sửa nếu đã được chấp nhận hoặc đã rút
      if (submission.status === SubmissionStatus.ACCEPTED) {
        throw new BadRequestException('Không thể sửa bài đã được chấp nhận');
      }

      if (submission.status === SubmissionStatus.WITHDRAWN) {
        throw new BadRequestException('Không thể sửa bài đã rút');
      }

      // Check deadline
      console.log('🔍 Checking deadline for conference:', submission.conference_id);
      await this.conferenceClient.checkDeadline(submission.conference_id);
      console.log('✅ Deadline check passed');

      try {
        // Cập nhật các trường
        console.log('📝 Starting field updates...');

        if (updateData.title) {
          submission.title = updateData.title;
          console.log('✅ Title updated:', updateData.title);
        }

        if (updateData.abstract !== undefined) {
          submission.abstract = updateData.abstract;
          console.log('✅ Abstract updated');
        }

        if (updateData.authors) {
          // Parse authors if it's a string (from form-data)
          const authorsData = typeof updateData.authors === 'string'
            ? JSON.parse(updateData.authors)
            : updateData.authors;
          submission.authors = authorsData;
          console.log('✅ Authors updated');
        }

        console.log('🔄 Saving submission...');
        await this.subRepo.save(submission);
        console.log('✅ Submission saved');
      } catch (updateError) {
        console.error('❌ Error during update:', updateError);
        throw updateError;
      }

      // Audit log
      await this.logAudit(
        'UPDATE',
        'SUBMISSION',
        id,
        userId,
        `Updated submission metadata: ${JSON.stringify(updateData)}`
      );

      return {
        status: 'success',
        message: 'Đã cập nhật bài nộp thành công',
        data: submission
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi cập nhật bài nộp');
    }
  }

  // --- API 7: WITHDRAW SUBMISSION (AUTHOR ONLY) ---
  async withdrawSubmission(id: number, userId: number) {
    try {
      const submission = await this.subRepo.findOne({ where: { id } });

      if (!submission) {
        throw new NotFoundException(`Không tìm thấy bài nộp với ID ${id}`);
      }

      // Kiểm tra ownership
      if (submission.created_by !== userId) {
        throw new ForbiddenException('Bạn chỉ có thể rút bài nộp của mình');
      }

      // Không cho phép withdraw nếu đã được chấp nhận
      if (submission.status === SubmissionStatus.ACCEPTED) {
        throw new BadRequestException('Không thể rút bài đã được chấp nhận');
      }

      // Soft delete: đổi status thành WITHDRAWN
      submission.status = SubmissionStatus.WITHDRAWN;
      submission.withdrawn_at = new Date();
      await this.subRepo.save(submission);

      // Audit log
      await this.logAudit('WITHDRAW', 'SUBMISSION', id, userId, 'Author withdrew submission');

      // Notify Review Service
      await this.reviewClient.notifyStatusChange(id, SubmissionStatus.WITHDRAWN);

      return {
        status: 'success',
        message: 'Đã rút bài nộp thành công'
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi rút bài nộp');
    }
  }

  // --- API 8: UPLOAD CAMERA-READY (AUTHOR ONLY) ---
  async uploadCameraReady(id: number, file: Express.Multer.File, userId: number) {
    try {
      const submission = await this.subRepo.findOne({
        where: { id },
        relations: ['files']
      });

      if (!submission) {
        throw new NotFoundException(`Không tìm thấy bài nộp với ID ${id}`);
      }

      // Kiểm tra ownership
      if (submission.created_by !== userId) {
        throw new ForbiddenException('Bạn chỉ có thể upload camera-ready cho bài nộp của mình');
      }

      // Chỉ cho phép upload camera-ready nếu đã được chấp nhận
      if (submission.status !== SubmissionStatus.ACCEPTED) {
        throw new BadRequestException('Chỉ có thể upload camera-ready cho bài đã được chấp nhận');
      }

      // Tính version cho camera-ready (bắt đầu từ camera_ready_v1)
      const cameraReadyFiles = await this.fileRepo.find({
        where: { submission_id: id },
        order: { version: 'DESC' }
      });

      // Count camera-ready versions (files with version >= 100)
      const cameraReadyCount = cameraReadyFiles.filter(f => f.version >= 100).length;
      const cameraReadyVersion = 100 + cameraReadyCount + 1; // Start from 101

      // Chuẩn bị đường dẫn
      const fileExt = file.originalname.split('.').pop();
      const fileName = `camera_ready_v${cameraReadyCount + 1}.${fileExt}`;
      const path = `papers/${submission.id}/camera-ready/${fileName}`;

      // Upload to Supabase
      const { error: uploadError } = await this.supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME || 'submission')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        throw new BadRequestException(`Lỗi Cloud Storage: ${uploadError.message}`);
      }

      // Lấy URL công khai
      const { data: { publicUrl } } = this.supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME || 'submission')
        .getPublicUrl(path);

      // Lưu vào Database
      const savedFile = await this.fileRepo.save({
        submission_id: id,  // Use id parameter directly
        file_path: publicUrl,
        version: cameraReadyVersion
      });

      // Update submission camera_ready timestamp using update to avoid cascade
      await this.subRepo.update(id, {
        camera_ready_submitted_at: new Date()
      });

      // Audit log
      await this.logAudit(
        'UPLOAD_CAMERA_READY',
        'FILE',
        savedFile.id,
        userId,
        `Uploaded camera-ready version ${cameraReadyCount + 1}`
      );

      return {
        status: 'success',
        message: `Đã upload camera-ready version ${cameraReadyCount + 1} thành công`,
        data: {
          submissionId: submission.id,
          fileId: savedFile.id,
          version: cameraReadyVersion,
          url: publicUrl,
          submittedAt: submission.camera_ready_submitted_at
        }
      };
    } catch (error) {
      console.error('Camera-ready upload error:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi upload camera-ready');
    }
  }
  // --- API: LẤY REVIEWS CỦA SUBMISSION (ẨN DANH CHO AUTHOR) ---
  async getSubmissionReviews(
    submissionId: number,
    userId: number,
    userRoles: string[]
  ) {
    try {
      // 1. Kiểm tra submission tồn tại
      const submission = await this.subRepo.findOne({
        where: { id: submissionId }
      });

      if (!submission) {
        throw new NotFoundException('Submission không tồn tại');
      }

      // 2. Kiểm tra quyền xem
      const isChair = userRoles.includes('CHAIR') || userRoles.includes('ADMIN');
      const isOwner = submission.created_by === userId;

      if (!isChair && !isOwner) {
        throw new ForbiddenException('Bạn không có quyền xem reviews của submission này');
      }

      // 3. Lấy reviews từ Review Service
      const reviews = await this.reviewClient.getReviewsForSubmission(
        submissionId,
        isChair  // CHAIR thấy full info, AUTHOR thấy ẩn danh
      );

      return {
        status: 'success',
        data: reviews
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi lấy reviews');
    }
  }

  // Helper method: Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // --- API (Internal): LẤY URL file public mới nhất theo submission id ---
  async getPublicFileInfoBySubmissionId(submissionId: number) {
    try {
      const file = await this.fileRepo.findOne({
        where: { submission_id: submissionId },
        order: { version: 'DESC' }
      });

      if (!file) {
        throw new NotFoundException(`Không tìm thấy file cho submission id ${submissionId}`);
      }

      return {
        status: 'success',
        data: {
          fileId: file.id,
          url: file.file_path,
          version: file.version
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi lấy thông tin file public');
    }
  }
}
