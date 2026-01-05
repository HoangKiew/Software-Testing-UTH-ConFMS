import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Assignment } from './entities/assignment.entity';
import { Review } from './entities/review.entity';
import { ReviewEditHistory } from './entities/review-edit-history.entity';
import { DiscussionMessage } from './entities/discussion.entity';

@Injectable()
export class ReviewerService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewEditHistory)
    private readonly historyRepo: Repository<ReviewEditHistory>,
    @InjectRepository(DiscussionMessage)
    private readonly discussionRepo: Repository<DiscussionMessage>,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async listAssignments(reviewerId: number) {
    return this.assignmentRepo.find({ where: { reviewerId: reviewerId } });
  }

  async acceptAssignment(id: number, reviewerId: number) {
    const a = await this.assignmentRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Assignment not found');
    if (a.reviewerId !== reviewerId) throw new ForbiddenException();
    if (a.status === 'accepted') {
      throw new BadRequestException('Assignment already accepted');
    }
    if (a.status === 'rejected') {
      throw new BadRequestException('Cannot accept a rejected assignment');
    }
    // Kiểm tra acceptDeadline (nếu có)
    const now = new Date();
    const accDeadline = (a as any).acceptDeadline || a.deadline;
    if (accDeadline && now > new Date(accDeadline)) {
      throw new BadRequestException('Đã quá hạn chấp nhận phân công');
    }

    a.status = 'accepted';
    return this.assignmentRepo.save(a);
  }

  async rejectAssignment(id: number, reviewerId: number) {
    const a = await this.assignmentRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Assignment not found');
    if (a.reviewerId !== reviewerId) throw new ForbiddenException();
    if (a.status === 'rejected') {
      throw new BadRequestException('Assignment already rejected');
    }
    // Kiểm tra acceptDeadline (nếu có)
    const now = new Date();
    const accDeadline = (a as any).acceptDeadline || a.deadline;
    if (accDeadline && now > new Date(accDeadline)) {
      throw new BadRequestException('Đã quá hạn chấp nhận phân công');
    }

    a.status = 'rejected';
    return this.assignmentRepo.save(a);
  }

  /**
   * Kiểm tra assignment có được accept và còn trong deadline không
   */
  private async validateAssignmentForReview(assignmentId: number, reviewerId: number): Promise<Assignment> {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.reviewerId !== reviewerId) throw new ForbiddenException();
    // Cho phép trạng thái 'accepted' hoặc 'completed' (đã submit final) làm việc
    if (assignment.status !== 'accepted' && assignment.status !== 'completed') {
      throw new ForbiddenException('Chỉ có thể đánh giá bài báo đã được chấp nhận (accepted)');
    }
    // Kiểm tra reviewDeadline (không cho phép đánh giá nếu đã quá hạn)
    const rd = (assignment as any).reviewDeadline || assignment.deadline;
    if (rd && new Date() > new Date(rd)) {
      throw new BadRequestException('Đã quá hạn deadline đánh giá, không thể đánh giá hoặc chỉnh sửa');
    }
    return assignment;
  }

  async getReviewByAssignment(assignmentId: number, reviewerId: number) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.reviewerId !== reviewerId) throw new ForbiddenException();
    
    const review = await this.reviewRepo.findOne({ where: { assignmentId, reviewerId } });
    if (!review) return null;
    
    // Lấy lịch sử chỉnh sửa
    const histories = await this.historyRepo.find({ where: { reviewId: review.id } });
    
    return {
      ...review,
      histories,
    };
  }

  async createReview(assignmentId: number, payload: Partial<Review>, reviewerId: number) {
    // Kiểm tra assignment đã được accept/allowed và còn deadline
    const assignment = await this.validateAssignmentForReview(assignmentId, reviewerId);
    
    // Kiểm tra xem đã có review chưa
    const existingReview = await this.reviewRepo.findOne({ where: { assignmentId, reviewerId } });
    if (existingReview) {
      throw new BadRequestException('Review already exists. Use update endpoint to modify.');
    }
    
    // Do not allow setting final via create/update here. Final submission must use submitFinal endpoint.
    const r = this.reviewRepo.create({ ...payload, assignmentId, reviewerId, isFinal: false });
    const saved = await this.reviewRepo.save(r);
    return saved;
  }

  async updateReview(assignmentId: number, payload: Partial<Review>, reviewerId: number) {
    // Kiểm tra assignment đã được accept và còn deadline
    const assignment = await this.validateAssignmentForReview(assignmentId, reviewerId);
    
    const review = await this.reviewRepo.findOne({ where: { assignmentId, reviewerId } });
    if (!review) throw new NotFoundException('Review not found');
    
    // Lưu lịch sử chỉnh sửa
    await this.historyRepo.save({ 
      reviewId: review.id, 
      reviewerId, 
      oldData: { ...review } 
    });
    
    Object.assign(review, payload);
    const saved = await this.reviewRepo.save(review);

    // Do not allow setting isFinal via update; use submitFinal endpoint instead.
    return saved;
  }

  /**
   * Submit final review: require existing review with score and publicComment,
   * mark review.isFinal = true and assignment.status = 'completed' for that reviewer.
   */
  async submitFinal(assignmentId: number, reviewerId: number) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.reviewerId !== reviewerId) throw new ForbiddenException();
    if (assignment.status === 'rejected') throw new BadRequestException('Cannot submit final for rejected assignment');
    // idempotent: if already completed, ensure review.isFinal = true and return success
    if (assignment.status === 'completed') {
      const existing = await this.reviewRepo.findOne({ where: { assignmentId, reviewerId } });
      if (existing && !existing.isFinal) {
        existing.isFinal = true;
        await this.reviewRepo.save(existing);
      }
      return { success: true, review: existing, assignment };
    }

    // Ensure within review deadline
    const rd = (assignment as any).reviewDeadline || assignment.deadline;
    if (rd && new Date() > new Date(rd)) {
      throw new BadRequestException('Đã quá hạn deadline đánh giá, không thể nộp final');
    }

    const review = await this.reviewRepo.findOne({ where: { assignmentId, reviewerId } });
    if (!review) throw new BadRequestException('Không tìm thấy review để submit final');
    if (review.score == null || !review.publicComment) {
      throw new BadRequestException('Để nộp final cần có `score` và `publicComment`');
    }

    review.isFinal = true;
    await this.reviewRepo.save(review);

    assignment.status = 'completed';
    await this.assignmentRepo.save(assignment);

    return { success: true, review, assignment };
  }

  async getReviewHistory(reviewId: string, reviewerId: number) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.reviewerId !== reviewerId) throw new ForbiddenException();
    
    return this.historyRepo.find({ where: { reviewId } });
  }

  /**
   * Kiểm tra reviewer có được phép tham gia discussion không
   * Chỉ reviewers đã accept cùng submissionId mới được phép
   */
  private async validateDiscussionAccess(submissionId: string, reviewerId: number): Promise<void> {
    const assignment = await this.assignmentRepo.findOne({ where: { submissionId, reviewerId } });

    if (!assignment || (assignment.status !== 'accepted' && assignment.status !== 'completed')) {
      throw new ForbiddenException('Chỉ có thể tham gia thảo luận cho bài báo đã được chấp nhận đánh giá');
    }
  }

  async listDiscussion(submissionId: string, requesterId: number) {
    // Kiểm tra reviewer có quyền xem discussion không
    await this.validateDiscussionAccess(submissionId, requesterId);
    
    return this.discussionRepo.find({ 
      where: { submissionId }, 
      order: { createdAt: 'ASC' } 
    });
  }

  async postDiscussion(submissionId: string, content: string, senderId: number) {
    // Kiểm tra reviewer có quyền tham gia discussion không
    await this.validateDiscussionAccess(submissionId, senderId);
    
    const m = this.discussionRepo.create({ submissionId, content, senderId });
    return this.discussionRepo.save(m);
  }

  /**
   * Lấy thông tin bài báo từ submission-service
   * Tạm thời trả về 404 nếu submission-service chưa có endpoint
   */
  async getPaper(assignmentId: number, reviewerId: number) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.reviewerId !== reviewerId) throw new ForbiddenException();
    
    // Chỉ cho phép xem paper nếu đã accept hoặc đã completed (submit final)
    if (assignment.status !== 'accepted' && assignment.status !== 'completed') {
      throw new ForbiddenException('Chỉ có thể xem bài báo sau khi đã chấp nhận đánh giá');
    }
    
    // Gọi submission-service để lấy file (proxy). Nếu submission-service không có endpoint,
    // trả về NotFound.
    const submissionBase = this.config.get<string>('SUBMISSION_SERVICE_URL') || this.config.get<string>('SUBMISSION_SERVICE') || 'http://submission-service:3003';
    const url = `${submissionBase}/api/submissions/${assignment.submissionId}/file`;
    try {
      const resp = await this.httpService.axiosRef.get(url, { responseType: 'arraybuffer' });
      const contentType = resp.headers['content-type'] || 'application/octet-stream';
      return {
        filename: `${assignment.submissionId}.pdf`,
        contentType,
        data: Buffer.from(resp.data).toString('base64'),
      };
    } catch (err: any) {
      throw new NotFoundException('Không thể lấy file từ submission-service');
    }
  }
}
