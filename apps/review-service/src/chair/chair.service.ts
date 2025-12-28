import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decision, FinalDecision } from '../entities/decision.entity';
import { Review } from '../entities/review.entity';
import { Assignment } from '../entities/assignment.entity';
import { DiscussionMessage } from '../entities/discussion-message.entity';

@Injectable()
export class ChairService {
  constructor(
    @InjectRepository(Decision)
    private decisionRepo: Repository<Decision>,
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    @InjectRepository(DiscussionMessage)
    private messageRepo: Repository<DiscussionMessage>,
  ) {}

  // 1. Xem tổng hợp đánh giá của một bài báo
  async getSubmissionReviewsSummary(submissionId: string, chairId: string) {
    // Kiểm tra chair có quyền quản lý submission này không (qua conferenceId hoặc assignedBy)
    const assignments = await this.assignmentRepo.find({
      where: { submissionId },
    });

    if (assignments.length === 0) {
      throw new NotFoundException('Không tìm thấy bài báo này');
    }

    // Giả sử chair quản lý tất cả bài trong hội nghị (có thể kiểm tra conferenceId + chairId sau)
    const reviews = await this.reviewRepo.find({
      where: { assignment: { submissionId } },
    });

    if (reviews.length === 0) {
      return {
        submissionId,
        totalReviews: 0,
        averageScores: null,
        reviews: [],
        decision: FinalDecision.PENDING,
      };
    }

    // Tính điểm trung bình
    const sum = reviews.reduce(
      (acc, r) => ({
        originality: acc.originality + r.originality,
        technicalQuality: acc.technicalQuality + r.technicalQuality,
        clarity: acc.clarity + r.clarity,
        relevance: acc.relevance + r.relevance,
        overall: acc.overall + r.overall,
      }),
      { originality: 0, technicalQuality: 0, clarity: 0, relevance: 0, overall: 0 },
    );

    const avg = {
      originality: Number((sum.originality / reviews.length).toFixed(1)),
      technicalQuality: Number((sum.technicalQuality / reviews.length).toFixed(1)),
      clarity: Number((sum.clarity / reviews.length).toFixed(1)),
      relevance: Number((sum.relevance / reviews.length).toFixed(1)),
      overall: Number((sum.overall / reviews.length).toFixed(1)),
    };

    // Lấy quyết định hiện tại
    const decision = await this.decisionRepo.findOne({ where: { submissionId } });

    return {
      submissionId,
      totalReviews: reviews.length,
      averageScores: avg,
      variance: this.calculateVariance(reviews), // Chênh lệch quan điểm
      reviews: reviews.map(r => ({
        reviewerId: r.reviewerId,
        scores: {
          originality: r.originality,
          technicalQuality: r.technicalQuality,
          clarity: r.clarity,
          relevance: r.relevance,
          overall: r.overall,
        },
        publicComment: r.publicComment,
        privateComment: r.privateComment, // Chỉ Chair thấy
        submittedAt: r.createdAt,
      })),
      currentDecision: decision?.decision || FinalDecision.PENDING,
      chairComment: decision?.chairComment || null,
    };
  }

  private calculateVariance(reviews: Review[]) {
    if (reviews.length < 2) return null;
    const overalls = reviews.map(r => r.overall);
    const mean = overalls.reduce((a, b) => a + b, 0) / overalls.length;
    const variance = overalls.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / overalls.length;
    return Number(variance.toFixed(1));
  }

  // 2. Ra quyết định cuối cùng
  async makeDecision(
    submissionId: string,
    chairId: string,
    decision: FinalDecision,
    chairComment?: string,
  ): Promise<Decision> {
    let dec = await this.decisionRepo.findOne({ where: { submissionId } });

    if (!dec) {
      dec = this.decisionRepo.create({
        submissionId,
        conferenceId: 'conf-001', // Có thể lấy từ assignment
        decidedBy: chairId,
        decision,
        chairComment: chairComment ?? null,
      });
    } else {
      dec.decision = decision;
      dec.chairComment = chairComment ?? null;
    }

    return this.decisionRepo.save(dec);
  }

  // 3. Gửi thông báo hàng loạt (mock – sau này tích hợp email real)
  async sendBulkNotification(submissionIds: string[]) {
    // Mock: chỉ trả về thông báo thành công
    return {
      message: 'Gửi thông báo thành công (mock)',
      sentTo: submissionIds,
      timestamp: new Date().toISOString(),
      contentPreview: 'Kết quả phản biện đã được gửi ẩn danh đến tác giả',
    };
  }

  // 4. Tham gia thảo luận (dùng chung với reviewer)
  async sendDiscussionMessage(submissionId: string, senderId: string, content: string) {
    // Chair có quyền gửi ở mọi submission
    const message = this.messageRepo.create({
      submissionId,
      senderId,
      content,
    });
    return this.messageRepo.save(message);
  }

  async getDiscussion(submissionId: string): Promise<DiscussionMessage[]> {
    return this.messageRepo.find({
      where: { submissionId },
      order: { createdAt: 'ASC' },
    });
  }
}