import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import {
  Assignment,
  AssignmentStatus,
} from '../entities/assignment.entity';
import { Review } from '../entities/review.entity';
import { ReviewHistory } from '../entities/review-history.entity';
import { DiscussionMessage } from '../entities/discussion-message.entity';

interface ReviewerAssignmentResponse {
  assignmentId: number;        // ID assignment
  submissionId: string;        // ID bài báo
  conferenceId: string;        // ID hội nghị
  title: string;               // Tiêu đề
  abstract: string;            // Abstract
  status: AssignmentStatus;    // pending | accepted | rejected
  deadline: Date;              // Deadline
  canAct: boolean;             // Có được accept / reject không
}

@Injectable()
export class ReviewerService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(ReviewHistory)
    private historyRepo: Repository<ReviewHistory>,
    @InjectRepository(DiscussionMessage)
    private messageRepo: Repository<DiscussionMessage>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Reviewer xem danh sách bài được phân công
   */
  async getAssignedAssignments(
    reviewerId: string,
  ): Promise<ReviewerAssignmentResponse[]> {
    const assignments = await this.assignmentRepo.find({
      where: { reviewerId },
      order: { createdAt: 'DESC' },
    });

    const result: ReviewerAssignmentResponse[] = [];

    for (const assignment of assignments) {
      let title = 'Không tải được thông tin bài báo';
      let abstract = '';

      try {
        // Gọi submission-service
        const { data } = await firstValueFrom(
          this.httpService.get(
            `${process.env.SUBMISSION_SERVICE_URL}/api/submissions/${assignment.submissionId}/info`,
          ),
        );

        title = data?.title ?? 'Chưa có tiêu đề';
        abstract = data?.abstract ?? '';
      } catch (error) {
        // Log nếu cần
      }

      result.push({
        assignmentId: assignment.id,
        submissionId: assignment.submissionId,
        conferenceId: assignment.conferenceId,
        title,
        abstract,
        status: assignment.status,
        deadline: assignment.deadline,

        // Chỉ được hành động khi:
        // - Trạng thái là PENDING
        // - Chưa quá deadline
        canAct:
          assignment.status === AssignmentStatus.PENDING &&
          new Date() < new Date(assignment.deadline),
      });
    }

    return result;
  }

  /**
   * Reviewer chấp nhận review
   */
  async acceptAssignment(
    assignmentId: number,
    reviewerId: string,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, reviewerId },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy nhiệm vụ phản biện');
    }

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new ForbiddenException(
        'Nhiệm vụ này đã được xử lý trước đó',
      );
    }

    if (new Date() > new Date(assignment.deadline)) {
      throw new ForbiddenException('Đã quá hạn phản hồi nhiệm vụ');
    }

    assignment.status = AssignmentStatus.ACCEPTED;
    return this.assignmentRepo.save(assignment);
  }

  /**
   * Reviewer từ chối review
   */
  async rejectAssignment(
    assignmentId: number,
    reviewerId: string,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, reviewerId },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy nhiệm vụ phản biện');
    }

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new ForbiddenException(
        'Nhiệm vụ này đã được xử lý trước đó',
      );
    }

    if (new Date() > new Date(assignment.deadline)) {
      throw new ForbiddenException('Đã quá hạn phản hồi nhiệm vụ');
    }

    assignment.status = AssignmentStatus.REJECTED;
    return this.assignmentRepo.save(assignment);
  }

// === 2. Lấy link tải file bài báo ===
// Thêm vào ReviewerService class
async getPaperFileUrlForReviewer(assignmentId: number, reviewerId: string): Promise<{ fileUrl: string }> {
  const assignment = await this.assignmentRepo.findOne({
    where: { id: assignmentId, reviewerId, status: AssignmentStatus.ACCEPTED },
  });

  if (!assignment) {
    throw new ForbiddenException('Bạn không có quyền truy cập file bài báo này');
  }

  const submissionUrl = this.configService.get<string>('SUBMISSION_SERVICE_URL');
  try {
    const res = await firstValueFrom(
      this.httpService.get(`${submissionUrl}/submissions/${assignment.submissionId}/file`),
    );
    return { fileUrl: res.data.fileUrl };
  } catch (error) {
    throw new NotFoundException('Không thể lấy file từ submission-service');
  }
}

  // === 3. Submit đánh giá lần đầu ===
  async submitReview(assignmentId: number, reviewerId: string, body: any): Promise<Review> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, reviewerId, status: AssignmentStatus.ACCEPTED },
    });

    if (!assignment) {
      throw new ForbiddenException('Bạn chưa chấp nhận nhiệm vụ này');
    }

    if (new Date() > assignment.deadline) {
      throw new ForbiddenException('Đã quá hạn nộp đánh giá');
    }

    const existing = await this.reviewRepo.findOne({ where: { assignmentId } });
    if (existing?.isFinal) {
      throw new BadRequestException('Bạn đã nộp đánh giá cuối cùng rồi');
    }

    const review = existing || this.reviewRepo.create();
    Object.assign(review, {
      assignmentId,
      reviewerId,
      originality: body.originality ?? 0,
      technicalQuality: body.technicalQuality ?? 0,
      clarity: body.clarity ?? 0,
      relevance: body.relevance ?? 0,
      overall: body.overall ?? 0,
      publicComment: body.publicComment || null,
      privateComment: body.privateComment || null,
      isFinal: true,
    });

    return this.reviewRepo.save(review);
  }

  // === 4. Lấy đánh giá hiện tại của mình ===
  async getMyReview(assignmentId: number, reviewerId: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { assignmentId, reviewerId },
      relations: ['histories'],
      order: { histories: { editedAt: 'DESC' } },
    });

    if (!review) {
      throw new NotFoundException('Chưa có đánh giá nào');
    }

    return review;
  }

  // === 5. Chỉnh sửa đánh giá (trước deadline) ===
  async updateReview(assignmentId: number, reviewerId: string, body: any): Promise<Review> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, reviewerId, status: AssignmentStatus.ACCEPTED },
    });

    if (!assignment || new Date() > assignment.deadline) {
      throw new ForbiddenException('Không thể chỉnh sửa: quá hạn hoặc chưa accept');
    }

    const review = await this.reviewRepo.findOne({ where: { assignmentId, reviewerId } });
    if (!review) {
      throw new NotFoundException('Chưa có đánh giá để sửa');
    }

    // Lưu lịch sử trước khi sửa
    await this.historyRepo.save({
      reviewId: review.id,
      ...review,
      editedBy: reviewerId,
    });

    // Cập nhật các trường nếu có
    if (body.originality !== undefined) review.originality = body.originality;
    if (body.technicalQuality !== undefined) review.technicalQuality = body.technicalQuality;
    if (body.clarity !== undefined) review.clarity = body.clarity;
    if (body.relevance !== undefined) review.relevance = body.relevance;
    if (body.overall !== undefined) review.overall = body.overall;
    if (body.publicComment !== undefined) review.publicComment = body.publicComment;
    if (body.privateComment !== undefined) review.privateComment = body.privateComment;

    return this.reviewRepo.save(review);
  }

  // === 6. Gửi tin nhắn thảo luận nội bộ ===
  async sendDiscussionMessage(submissionId: string, senderId: string, content: string) {
    // Kiểm tra sender có quyền (là reviewer của submission)
    const hasAccess = await this.assignmentRepo.exist({
      where: [
        { submissionId, reviewerId: senderId },
        // TODO: sau này thêm { submissionId, assignedBy: senderId } cho chair
      ],
    });

    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền tham gia thảo luận này');
    }

    const message = this.messageRepo.create({
      submissionId,
      senderId,
      content,
    });

    return this.messageRepo.save(message);
  }

  // === 7. Lấy toàn bộ thảo luận của bài báo ===
  async getDiscussion(submissionId: string, userId: string): Promise<DiscussionMessage[]> {
    const hasAccess = await this.assignmentRepo.exist({
      where: [
        { submissionId, reviewerId: userId },
        // TODO: thêm chair
      ],
    });

    if (!hasAccess) {
      throw new ForbiddenException('Không có quyền xem thảo luận');
    }

    return this.messageRepo.find({
      where: { submissionId },
      order: { createdAt: 'ASC' },
    });
  }
}
  



