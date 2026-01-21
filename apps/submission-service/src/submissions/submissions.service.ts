import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like, In } from 'typeorm';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { SubmissionVersion } from '../entities/submission-version.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';
import { SupabaseService } from '../supabase/supabase.config';
import { ConferenceClientService } from '../integrations/conference-client.service';
import { ReviewClientService } from '../integrations/review-client.service';
import { IdentityClientService } from '../integrations/identity-client.service';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(SubmissionVersion)
    private submissionVersionRepository: Repository<SubmissionVersion>,
    private supabaseService: SupabaseService,
    private dataSource: DataSource,
    private conferenceClient: ConferenceClientService,
    private reviewClient: ReviewClientService,
    private identityClient: IdentityClientService,
    private emailService: EmailService,
  ) {}
// Upload file lên Supabase
  async uploadFile(file: Express.Multer.File | undefined): Promise<string> {
    if (!file) {
      throw new BadRequestException('File không được để trống');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/zip',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Chỉ chấp nhận file PDF, DOCX hoặc ZIP',
      );
    }

    const getFileExtension = (mimetype: string): string => {
      if (mimetype === 'application/pdf') return '.pdf';
      if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
      if (mimetype === 'application/zip') return '.zip';
      return '.pdf'; 
    };

    const supabase = this.supabaseService.getClient();
    const bucketName = 'submissions';
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const fileExtension = getFileExtension(file.mimetype);
    const fileName = `${timestamp}-${uuid}${fileExtension}`;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(`Lỗi khi upload file: ${error.message}`);
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Lỗi khi upload file: ${error.message}`);
    }
  }
// Validate trạng thái chuyển đổi
  private validateStatusTransition(
    currentStatus: SubmissionStatus,
    newStatus: SubmissionStatus,
  ): boolean {
    const allowedTransitions: Record<SubmissionStatus, SubmissionStatus[]> = {
      [SubmissionStatus.SUBMITTED]: [
        SubmissionStatus.REVIEWING,
        SubmissionStatus.WITHDRAWN,
      ],
      [SubmissionStatus.REVIEWING]: [
        SubmissionStatus.ACCEPTED,
        SubmissionStatus.REJECTED,
        SubmissionStatus.WITHDRAWN,
      ],
      [SubmissionStatus.ACCEPTED]: [SubmissionStatus.CAMERA_READY],
      [SubmissionStatus.REJECTED]: [],
      [SubmissionStatus.WITHDRAWN]: [],
      [SubmissionStatus.CAMERA_READY]: [],
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
// Tạo submission mới
  async create(
    createDto: CreateSubmissionDto,
    file: Express.Multer.File,
    authorId: number,
    authorName?: string,
  ): Promise<Submission> {
    if (!file) {
      throw new BadRequestException('File là bắt buộc (PDF, DOCX hoặc ZIP)');
    }

    // Check deadline trước khi nộp bài
    try {
      const deadlineCheck = await this.conferenceClient.checkDeadline(
        createDto.conferenceId,
        'submission',
      );
      if (!deadlineCheck.valid) {
        throw new BadRequestException(
          `Hạn nộp bài đã qua: ${deadlineCheck.message}`,
        );
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fileUrl = await this.uploadFile(file);
      let parsedCoAuthors: Array<{ name: string; email: string; affiliation?: string }> | null = null;
      if (createDto.coAuthors) {
        try {
          parsedCoAuthors = JSON.parse(createDto.coAuthors);
        } catch (e) {
        }
      }
      const submission = this.submissionRepository.create({
        title: createDto.title,
        abstract: createDto.abstract,
        keywords: createDto.keywords || null,
        fileUrl,
        status: SubmissionStatus.SUBMITTED,
        authorId,
        authorName: authorName || null, // Lưu tên từ JWT token
        authorAffiliation: createDto.authorAffiliation || null,
        trackId: createDto.trackId,
        conferenceId: createDto.conferenceId,
        coAuthors: parsedCoAuthors,
        submittedAt: new Date(), // Lưu thời gian nộp bài
      });

      const savedSubmission = await queryRunner.manager.save(submission);
      await queryRunner.manager.insert(SubmissionVersion, {
        submissionId: savedSubmission.id,
        versionNumber: 1,
        title: savedSubmission.title,
        abstract: savedSubmission.abstract,
        fileUrl: savedSubmission.fileUrl,
        keywords: savedSubmission.keywords,
      });

      await queryRunner.commitTransaction();

      const result = await this.submissionRepository.findOne({
        where: { 
          id: savedSubmission.id,
          deletedAt: null as any,
          isActive: true,
        },
        relations: ['versions'],
      });

      if (!result) {
        throw new NotFoundException(`Không tìm thấy submission sau khi tạo`);
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
// cập nhật submission
  async update(
    id: string,
    updateDto: UpdateSubmissionDto,
    file: Express.Multer.File | undefined,
    authorId: number,
  ): Promise<Submission> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submission = await queryRunner.manager.findOne(Submission, {
        where: { 
          id,
          deletedAt: null as any,
          isActive: true,
        },
      });

      if (!submission) {
        throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
      }

      if (submission.authorId !== authorId) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật submission này',
        );
      }
      if (
        submission.status === SubmissionStatus.SUBMITTED ||
        submission.status === SubmissionStatus.REVIEWING
      ) {
        try {
          const deadlineCheck = await this.conferenceClient.checkDeadline(
            submission.conferenceId,
            'submission',
          );
          if (!deadlineCheck.valid) {
            throw new BadRequestException(
              `Không thể chỉnh sửa sau hạn nộp bài: ${deadlineCheck.message}`,
            );
          }
        } catch (e) {
          if (e instanceof BadRequestException) {
            throw e;
          }
        }
      }

      const existingVersions = await queryRunner.manager.find(
        SubmissionVersion,
        {
          where: { submissionId: id },
          select: ['versionNumber'],
        },
      );

      const maxVersion = existingVersions.length
        ? Math.max(...existingVersions.map((v) => v.versionNumber))
        : 0;

      const newVersionNumber = maxVersion + 1;
      await queryRunner.manager.insert(SubmissionVersion, {
        submissionId: submission.id,
        versionNumber: newVersionNumber,
        title: submission.title,
        abstract: submission.abstract,
        fileUrl: submission.fileUrl,
        keywords: submission.keywords,
      });

      let newFileUrl = submission.fileUrl;
      if (file) {
        newFileUrl = await this.uploadFile(file);
      }

      let parsedCoAuthors: Array<{ name: string; email: string; affiliation?: string }> | null = submission.coAuthors;
      if (updateDto.coAuthors !== undefined) {
        if (updateDto.coAuthors) {
          try {
            parsedCoAuthors = JSON.parse(updateDto.coAuthors);
          } catch (e) {
          }
        } else {
          parsedCoAuthors = null;
        }
      }

      Object.assign(submission, {
        title: updateDto.title ?? submission.title,
        abstract: updateDto.abstract ?? submission.abstract,
        keywords: updateDto.keywords ?? submission.keywords,
        trackId: updateDto.trackId ?? submission.trackId,
        fileUrl: newFileUrl,
        authorAffiliation: updateDto.authorAffiliation !== undefined ? updateDto.authorAffiliation : submission.authorAffiliation,
        coAuthors: parsedCoAuthors,
        submittedAt: new Date(), 
      });

      const updatedSubmission = await queryRunner.manager.save(submission);

      await queryRunner.commitTransaction();
      const result = await this.submissionRepository.findOne({
        where: { 
          id: updatedSubmission.id,
          deletedAt: null as any,
          isActive: true,
        },
        relations: ['versions'],
      });

      if (!result) {
        throw new NotFoundException(
          `Không tìm thấy bài dự thi sau khi cập nhật`,
        );
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
// Rút submission
  async withdraw(id: string, authorId: number): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { 
        id,
        deletedAt: null as any,
        isActive: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }
    if (submission.authorId !== authorId) {
      throw new ForbiddenException('Bạn không có quyền rút submission này');
    }
    if (
      submission.status !== SubmissionStatus.SUBMITTED &&
      submission.status !== SubmissionStatus.REVIEWING
    ) {
      throw new BadRequestException(
        `Không thể rút bài ở trạng thái ${submission.status}`,
      );
    }
    try {
      const deadlineCheck = await this.conferenceClient.checkDeadline(
        submission.conferenceId,
        'submission',
      );
      if (!deadlineCheck.valid) {
        throw new BadRequestException(
          `Không thể rút bài sau hạn nộp: ${deadlineCheck.message}`,
        );
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
    }

    submission.status = SubmissionStatus.WITHDRAWN;
    return await this.submissionRepository.save(submission);
  }

// Update status submission
  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    userId: number,
    userRoles: string[],
    authToken?: string,
  ): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { 
        id,
        deletedAt: null as any,
        isActive: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }
    const isAutoReviewingTransition = 
      submission.status === 'SUBMITTED' && 
      updateStatusDto.status === 'REVIEWING';

    if (!isAutoReviewingTransition && !userRoles.includes('CHAIR') && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException(
        'Chỉ Chair hoặc Admin mới được cập nhật trạng thái',
      );
    }

    if (
      !this.validateStatusTransition(submission.status, updateStatusDto.status)
    ) {
      throw new BadRequestException(
        `Không thể chuyển từ ${submission.status} sang ${updateStatusDto.status}`,
      );
    }

    submission.status = updateStatusDto.status;
    const savedSubmission = await this.submissionRepository.save(submission);

    const newStatus = savedSubmission.status;
    const isAcceptedOrRejected = newStatus === SubmissionStatus.ACCEPTED || 
                                  newStatus === SubmissionStatus.REJECTED;

    if (authToken && isAcceptedOrRejected) {
      this.sendSubmissionStatusEmail(
        savedSubmission,
        newStatus as 'ACCEPTED' | 'REJECTED',
        updateStatusDto.decisionNote,
        authToken,
      ).catch(() => {
        // Ignore email error
      });
    }

    return savedSubmission;
  }

  // Gửi email thông báo khi submission status chuyển sang ACCEPTED hoặc REJECTED
  private async sendSubmissionStatusEmail(
    submission: Submission,
    status: 'ACCEPTED' | 'REJECTED',
    decisionNote?: string,
    authToken?: string,
  ): Promise<void> {
    if (!authToken) {
      return;
    }

    try {
      const authorInfo = await this.identityClient.getUserById(submission.authorId, authToken);
      
      if (!authorInfo || !authorInfo.email) {
        return;
      }

      const conferenceName = await this.conferenceClient.getConferenceName(submission.conferenceId);
      const authorName = authorInfo.fullName || authorInfo.email || 'Tác giả';

      if (status === 'ACCEPTED') {
        await this.emailService.sendSubmissionAcceptedEmail(
          authorInfo.email,
          authorName,
          submission.title,
          conferenceName,
          decisionNote,
        );
      } else if (status === 'REJECTED') {
        await this.emailService.sendSubmissionRejectedEmail(
          authorInfo.email,
          authorName,
          submission.title,
          conferenceName,
          decisionNote,
        );
      }
    } catch (error) {
    }
  }
// Upload camera-ready file
  async uploadCameraReady(
    id: string,
    file: Express.Multer.File,
    authorId: number,
  ): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { 
        id,
        deletedAt: null as any,
        isActive: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }
    if (submission.authorId !== authorId) {
      throw new ForbiddenException(
        'Bạn không có quyền upload camera-ready cho submission này',
      );
    }
    if (submission.status !== SubmissionStatus.ACCEPTED) {
      throw new BadRequestException(
        'Chỉ có thể upload camera-ready khi bài đã được chấp nhận',
      );
    }

    try {
      const deadlineCheck = await this.conferenceClient.checkDeadline(
        submission.conferenceId,
        'camera-ready',
      );
      if (!deadlineCheck.valid) {
        throw new BadRequestException(
          `Hạn nộp camera-ready đã qua: ${deadlineCheck.message}`,
        );
      }
    } catch (error: any) {
      throw error;
    }

    const cameraReadyFileUrl = await this.uploadFile(file);
    submission.cameraReadyFileUrl = cameraReadyFileUrl;
    submission.status = SubmissionStatus.CAMERA_READY;

    return await this.submissionRepository.save(submission);
  }
// Lấy ds submission fileetr và phân trang
  async findAll(
    queryDto: QuerySubmissionsDto,
    userId: number,
    userRoles: string[],
    authToken?: string,
  ): Promise<{
    data: Submission[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.submissionRepository.createQueryBuilder('submission');
  
    const isChairOrAdmin = userRoles.includes('CHAIR') || userRoles.includes('ADMIN');
    const isReviewer = userRoles.includes('REVIEWER') || userRoles.includes('PC_MEMBER');
    
    if (isReviewer && queryDto.trackId) {
      try {
        if (authToken) {
          await this.conferenceClient.checkReviewerTrackAssignment(
            userId,
            Number(queryDto.trackId),
            authToken,
          );
        }
      } catch (error) {
        throw new ForbiddenException('Bạn không có quyền xem submission của track này');
      }
    }
    
    if (!isChairOrAdmin && !isReviewer) {
      queryBuilder.where('submission.authorId = :userId', { userId });
    } else if (isReviewer && !queryDto.trackId) {
      queryBuilder.where('submission.authorId = :userId', { userId });
    }
    
    if (queryDto.trackId) {
      const trackIdNumber = Number(queryDto.trackId);
      queryBuilder.andWhere('submission.trackId = :trackId', {
        trackId: trackIdNumber,
      });
    }

    if (queryDto.conferenceId) {
      queryBuilder.andWhere('submission.conferenceId = :conferenceId', {
        conferenceId: queryDto.conferenceId,
      });
    }

    if (queryDto.status) {
      queryBuilder.andWhere('submission.status = :status', {
        status: queryDto.status,
      });
    }

    if (queryDto.authorId) {
      if (userRoles.includes('CHAIR') || userRoles.includes('ADMIN')) {
        queryBuilder.andWhere('submission.authorId = :authorId', {
          authorId: queryDto.authorId,
        });
      }
    }

    if (queryDto.search) {
      queryBuilder.andWhere(
        '(submission.title ILIKE :search OR submission.abstract ILIKE :search OR submission.keywords ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    queryBuilder.andWhere('submission.deletedAt IS NULL');
    queryBuilder.andWhere('submission.isActive = :isActive', { isActive: true });

    const total = await queryBuilder.getCount();

    const submissions = await queryBuilder
      .leftJoinAndSelect('submission.versions', 'versions')
      .orderBy('submission.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data: submissions,
      total,
      page,
      limit,
    };
  }

  // Lấy danh sách submissions của author
  async findAllByAuthor(authorId: number): Promise<Submission[]> {
    return await this.submissionRepository.find({
      where: { 
        authorId,
        deletedAt: null as any,
        isActive: true,
      },
      relations: ['versions'],
      order: { createdAt: 'DESC' },
    });
  }

  // Lấy submissions được assign cho reviewer
  async findAssignedSubmissions(
    reviewerId: number,
    assignmentIds: number[],
  ): Promise<Submission[]> {
    return [];
  }

  // Lấy chi tiết submission
  async findOne(
    id: string,
    userId: number,
    userRoles: string[],
    assignmentIds?: number[],
    authToken?: string,
  ): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { 
        id,
        deletedAt: null as any,
        isActive: true,
      },
      relations: ['versions'],
    });

    if (!submission) {
      throw new NotFoundException(`Bài dự thi với ID ${id} không tồn tại`);
    }
    const isAuthor = submission.authorId === userId;
    const isChair = userRoles.includes('CHAIR') || userRoles.includes('ADMIN');
    const isReviewer =
      userRoles.includes('PC_MEMBER') || userRoles.includes('REVIEWER');
    if (isAuthor) {
      if (submission.versions) {
        submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
      }
      return submission;
    }
    if (isChair) {
      if (submission.versions) {
        submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
      }
      return submission;
    }
    
    if (isReviewer) {
      let reviewerSubmissionIds: string[] = [];
      
      if (!assignmentIds || assignmentIds.length === 0) {
        try {
          const assignments = await this.reviewClient.getReviewerAssignments(authToken);
          reviewerSubmissionIds = assignments.map((a) => a.submissionId);
        } catch (error) {
          throw new ForbiddenException('Bạn không có quyền xem submission này');
        }
      }
      
      if (reviewerSubmissionIds.includes(id)) {
        if (submission.versions) {
          submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
        }
        return submission;
      }
      
      if (submission.trackId) {
        try {
          const trackCheck = await this.conferenceClient.checkReviewerTrackAssignment(
            userId,
            submission.trackId,
            authToken,
          );
          
          if (trackCheck.hasAccepted) {
            if (submission.versions) {
              submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
            }
            return submission;
          }
        } catch (error) {
          throw new ForbiddenException('Bạn không có quyền xem submission này');
        }
      }
    }

    throw new ForbiddenException('Bạn không có quyền xem submission này');
  }

  // Lấy reviews đã ẩn danh cho tác giả xem
  async getAnonymizedReviews(
    id: string,
    authorId: number,
  ): Promise<
    Array<{ score: number; commentForAuthor: string; recommendation: string }>
  > {
    const submission = await this.submissionRepository.findOne({
      where: { 
        id,
        deletedAt: null as any,
        isActive: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }
    if (submission.authorId !== authorId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem reviews của submission này',
      );
    }
    if (
      submission.status !== SubmissionStatus.ACCEPTED &&
      submission.status !== SubmissionStatus.REJECTED
    ) {
      return [];
    }

    return await this.reviewClient.getAnonymizedReviewsForAuthor(id);
  }

  // Đếm số lượng submission của author
  async countSubmissionsByAuthorId(authorId: number): Promise<number> {
    return await this.submissionRepository.count({
      where: {
        authorId,
        deletedAt: null as any,
        isActive: true,
      },
    });
  }
// Lấy danh sách submission IDs theo track ID
  async getSubmissionIdsByTrackId(trackId: number): Promise<string[]> {
    const submissions = await this.submissionRepository.find({
      where: {
        trackId,
        deletedAt: null as any,
        isActive: true,
      },
      select: ['id'],
    });

    return submissions.map(s => s.id);
  }
}




