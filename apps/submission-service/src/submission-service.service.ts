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

  // --- API 2: XỬ LÝ NỘP BÀI ---
  async handleSubmission(file: Express.Multer.File, dto: any) {
    try {
      // 0. Check Deadline
      await this.conferenceClient.checkDeadline(dto.conferenceId);

      // 1. Kiểm tra/Tạo Submission
      // Logic: Nếu cùng user, cùng title -> tính là version mới của submission cũ?
      // Hay luôn tạo mới? Theo user request: "Check Deadline trước khi cho phép lưu DB".
      // Giả sử logic là tạo mới hoặc update. Ở đây code cũ dùng findOne title + created_by.

      let sub = await this.subRepo.findOne({
        where: { title: dto.title, created_by: dto.createdBy },
        relations: ['authors']
      });

      if (!sub) {
        // Tạo mới
        sub = this.subRepo.create({
          title: dto.title,
          conference_id: dto.conferenceId,
          created_by: dto.createdBy,
          abstract: dto.abstract || '',
          authors: dto.authors // Cascade sẽ lưu authors
        });
        sub = await this.subRepo.save(sub);

        // Audit
        await this.logAudit('CREATE', 'SUBMISSION', sub.id, dto.createdBy, 'Created new submission');
      } else {
        // Nếu bài cũ, có thể update abstract/author? Tạm thời giữ nguyên logic cũ là chỉ thêm file ver mới.
      }

      // 2. Tính Version
      const version = await this.getNextVersion(sub.id);

      // 3. Chuẩn bị đường dẫn
      const fileExt = file.originalname.split('.').pop();
      const fileName = `v${version}.${fileExt}`;
      const path = `papers/${sub.id}/${fileName}`;

      // 4. Upload Supabase
      const { error: uploadError } = await this.supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'papers')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        throw new BadRequestException(`Lỗi Cloud Storage: ${uploadError.message}`);
      }

      // 5. Lấy URL công khai
      const { data: { publicUrl } } = this.supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'papers')
        .getPublicUrl(path);

      // 6. Lưu vào Database
      const savedFile = await this.fileRepo.save({
        submission_id: sub.id,
        file_path: publicUrl,
        version: version
      });

      // Audit File
      await this.logAudit('UPLOAD', 'FILE', savedFile.id, dto.createdBy, `Uploaded version ${version}`);

      // Notify Review Service
      await this.reviewClient.notifyNewSubmission(
        sub.id,
        sub.title,
        sub.conference_id,
        sub.authors || []
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
  async checkDeadline(confId: number) {
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
  async getSubmissionsByConference(conferenceId: number) {
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

  // --- API 6: WITHDRAW SUBMISSION (AUTHOR ONLY) ---
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
}