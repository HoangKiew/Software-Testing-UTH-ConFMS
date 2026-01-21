import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ReviewPreference,
  PreferenceType,
} from './entities/review-preference.entity';
import {
  Assignment,
  AssignmentStatus,
} from './entities/assignment.entity';
import { Review } from './entities/review.entity';
import { PcDiscussion } from './entities/pc-discussion.entity';
import { Decision, FinalDecision } from './entities/decision.entity';
import { Rebuttal } from './entities/rebuttal.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ConferenceClientService } from '../integrations/conference-client.service';
import { SubmissionClientService, Submission } from '../integrations/submission-client.service';
import { IdentityClientService } from '../integrations/identity-client.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewPreference)
    private readonly reviewPreferenceRepository: Repository<ReviewPreference>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(PcDiscussion)
    private readonly pcDiscussionRepository: Repository<PcDiscussion>,
    @InjectRepository(Decision)
    private readonly decisionRepository: Repository<Decision>,
    @InjectRepository(Rebuttal)
    private readonly rebuttalRepository: Repository<Rebuttal>,
    private readonly conferenceClient: ConferenceClientService,
    private readonly submissionClient: SubmissionClientService,
    private readonly identityClient: IdentityClientService,
  ) {}

  // Reviewer submit preference cho bài báo
  async submitBid(reviewerId: number, dto: CreateBidDto): Promise<ReviewPreference> {
    const existingBid = await this.reviewPreferenceRepository.findOne({
      where: {
        reviewerId,
        submissionId: dto.submissionId, 
      },
    });

    if (existingBid) {
      existingBid.preference = dto.preference;
      return this.reviewPreferenceRepository.save(existingBid);
    }
    const bid = this.reviewPreferenceRepository.create({
      reviewerId,
      submissionId: dto.submissionId, 
      conferenceId: dto.conferenceId,
      preference: dto.preference,
    });

    return this.reviewPreferenceRepository.save(bid);
  }

  // Kiểm tra Conflict of Interest (COI)
  async checkConflictOfInterest(
    reviewerId: number,
    submissionId: string | number,
    conferenceId?: number,
  ): Promise<boolean> {
    const submissionIdStr = typeof submissionId === 'string' ? submissionId : String(submissionId);
    const where: Record<string, any> = {
      reviewerId,
      submissionId: submissionIdStr,
    };
    if (typeof conferenceId === 'number') {
      where.conferenceId = conferenceId;
    }

    const preference = await this.reviewPreferenceRepository.findOne({
      where: where as any,
    });

    return preference?.preference === PreferenceType.CONFLICT;
  }

  // Reviewer tự phân công bài báo cho chính mình (khi đã chấp nhận track)
  async selfAssignSubmission(
    reviewerId: number,
    submissionId: string, 
    conferenceId: number,
  ): Promise<Assignment> {
    const hasConflict = await this.checkConflictOfInterest(
      reviewerId,
      submissionId,
      conferenceId,
    );

    if (hasConflict) {
      throw new BadRequestException(
        'Không thể tự phân công bài này vì bạn đã báo cáo xung đột lợi ích (CONFLICT)',
      );
    }

    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        reviewerId,
        submissionId,
        conferenceId,
      },
    });

    if (existingAssignment) {
      if (existingAssignment.status === AssignmentStatus.ACCEPTED) {
        return existingAssignment;
      }
      existingAssignment.status = AssignmentStatus.ACCEPTED;
      return this.assignmentRepository.save(existingAssignment);
    }

    // Create assignment with ACCEPTED status (reviewer already accepted track)
    const assignment = this.assignmentRepository.create({
      reviewerId,
      submissionId,
      conferenceId,
      assignedBy: reviewerId, // Self-assigned
      status: AssignmentStatus.ACCEPTED, // Auto-accept since reviewer accepted track
      dueDate: null,
    });

    return this.assignmentRepository.save(assignment);
  }

  // Lấy danh sách assignments của reviewer (có phân trang)
  async getMyAssignments(
    reviewerId: number,
    page = 1,
    limit = 10,
  ): Promise<Assignment[]> {
    const skip = (page - 1) * limit;

    return this.assignmentRepository.find({
      where: { reviewerId },
      order: { createdAt: 'DESC' },
      relations: ['review'],
      skip,
      take: limit,
    });
  }

  // Chấp nhận hoặc từ chối assignment
  async updateAssignmentStatus(
    assignmentId: number,
    reviewerId: number,
    status: AssignmentStatus.ACCEPTED | AssignmentStatus.REJECTED,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment không tồn tại');
    }

    if (assignment.reviewerId !== reviewerId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật assignment này',
      );
    }

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new BadRequestException(
        'Assignment này đã được xử lý rồi, không thể thay đổi trạng thái',
      );
    }

    assignment.status = status;
    return this.assignmentRepository.save(assignment);
  }

  // Reviewer nộp bài chấm (có thể tạo mới hoặc cập nhật nếu deadline chưa hết)
  async submitReview(reviewerId: number, dto: CreateReviewDto, authToken?: string): Promise<Review> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: dto.assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment không tồn tại');
    }
    if (assignment.reviewerId !== reviewerId) {
      throw new ForbiddenException(
        'Bạn không có quyền nộp review cho assignment này',
      );
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findOne({
      where: { assignmentId: dto.assignmentId },
    });

    // If assignment is COMPLETED, check if we can update existing review
    if (assignment.status === AssignmentStatus.COMPLETED) {
      if (!existingReview) {
        // This shouldn't happen, but handle gracefully
        throw new BadRequestException(
          'Assignment đã hoàn thành nhưng không tìm thấy review. Vui lòng liên hệ admin.',
        );
      }
      
      // Check assignment dueDate to see if deadline has passed
      if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
        throw new BadRequestException(
          'Đã hết hạn phản biện, không thể cập nhật đánh giá',
        );
      }
      
      // Deadline not passed or no dueDate, allow update
      existingReview.score = dto.score;
      existingReview.confidence = dto.confidence;
      existingReview.commentForAuthor = dto.commentForAuthor || null;
      existingReview.commentForPC = dto.commentForPC || null;
      existingReview.recommendation = dto.recommendation;
      
      const savedReview = await this.reviewRepository.save(existingReview);
      
      // Also update submission status if needed (same logic as new review)
      await this.updateSubmissionStatusIfNeeded(assignment, authToken);
      
      return savedReview;
    }

    // Only ACCEPTED assignments can submit new review
    if (assignment.status !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException(
        `Chỉ có thể nộp review khi assignment ở trạng thái ACCEPTED. Hiện tại: ${assignment.status}`,
      );
    }

    if (existingReview) {
      throw new BadRequestException('Review cho assignment này đã được nộp rồi');
    }

    // Create new review
    const review = this.reviewRepository.create({
      assignmentId: dto.assignmentId,
      conferenceId: assignment.conferenceId ?? null,
      score: dto.score,
      confidence: dto.confidence,
      commentForAuthor: dto.commentForAuthor || null,
      commentForPC: dto.commentForPC || null,
      recommendation: dto.recommendation,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update assignment status to COMPLETED
    assignment.status = AssignmentStatus.COMPLETED;
    await this.assignmentRepository.save(assignment);

    // Update submission status if needed
    await this.updateSubmissionStatusIfNeeded(assignment, authToken);

    return savedReview;
  }

  // Cập nhật submission status sang REVIEWING nếu cần
  private async updateSubmissionStatusIfNeeded(
    assignment: Assignment,
    authToken?: string,
  ): Promise<void> {
    if (!authToken || !assignment.submissionId) {
      return;
    }

    try {
      const submission = await this.submissionClient.getSubmissionById(
        assignment.submissionId,
        authToken,
      );
      
      if (submission && submission.status === 'SUBMITTED') {
        await this.submissionClient.updateSubmissionStatus(
          assignment.submissionId,
          'REVIEWING',
          authToken,
        );
      }
    } catch (error) {
      // Không throw error để không làm fail review submission
    }
  }

  // Kiểm tra reviewer có assignment cho submission này không
  async checkReviewerAssignment(
    reviewerId: number,
    submissionId: string | number,
  ): Promise<boolean> {
    // Ensure submissionId is string (UUID)
    const submissionIdStr = typeof submissionId === 'string' ? submissionId : String(submissionId);
    const assignment = await this.assignmentRepository.findOne({
      where: {
        reviewerId,
        submissionId: submissionIdStr,
      },
    });
    return !!assignment;
  }

  // Lấy tất cả reviews của một submission
  async getReviewsBySubmission(
    submissionId: string | number,
    page = 1,
    limit = 10,
    authToken?: string,
  ): Promise<any[]> {
    // Ensure submissionId is string (UUID)
    const submissionIdStr = typeof submissionId === 'string' ? submissionId : String(submissionId);
    // Find all assignments for this submission
    const assignments = await this.assignmentRepository.find({
      where: { submissionId: submissionIdStr },
    });

    const assignmentIds = assignments.map((a) => a.id);
    if (assignmentIds.length === 0) {
      return [];
    }

    // Get all reviews for these assignments
    const skip = (page - 1) * limit;

    const reviews = await this.reviewRepository.find({
      where: { assignmentId: In(assignmentIds) },
      relations: ['assignment'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Enrich reviews with reviewer names from identity service
    const reviewerIds = reviews
      .map((r) => r.assignment?.reviewerId)
      .filter((id): id is number => id !== undefined && id !== null);

    if (reviewerIds.length > 0 && authToken) {
      try {
        const userMap = await this.identityClient.getUsersByIds(reviewerIds, authToken);
        return reviews.map((review) => {
          const reviewerId = review.assignment?.reviewerId;
          const reviewer = reviewerId ? userMap.get(reviewerId) : null;
          
          return {
            ...review,
            reviewerId: reviewerId || review.assignment?.reviewerId,
            reviewerName: reviewer?.fullName || reviewer?.email || `Reviewer #${reviewerId}`,
          };
        });
      } catch (error) {
        // Return reviews without names if identity service fails
        return reviews.map((review) => ({
          ...review,
          reviewerId: review.assignment?.reviewerId,
          reviewerName: `Reviewer #${review.assignment?.reviewerId}`,
        }));
      }
    }

    // Return reviews without names if no auth token
    return reviews.map((review) => ({
      ...review,
      reviewerId: review.assignment?.reviewerId,
      reviewerName: `Reviewer #${review.assignment?.reviewerId}`,
    }));
  }

  // Lấy tất cả bids cho một submission
  async getBidsBySubmission(
    submissionId: string | number,
    page = 1,
    limit = 10,
  ): Promise<ReviewPreference[]> {
    const skip = (page - 1) * limit;
    // Ensure submissionId is string (UUID)
    const submissionIdStr = typeof submissionId === 'string' ? submissionId : String(submissionId);

    return this.reviewPreferenceRepository.find({
      where: { submissionId: submissionIdStr },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  // Lấy PC Discussions cho một submission
  async getDiscussionsBySubmission(
    submissionId: string | number,
    page = 1,
    limit = 20,
  ): Promise<PcDiscussion[]> {
    const skip = (page - 1) * limit;
    // Ensure submissionId is string (UUID)
    const submissionIdStr = typeof submissionId === 'string' ? submissionId : String(submissionId);

    return this.pcDiscussionRepository.find({
      where: { submissionId: submissionIdStr },
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });
  }

  // Lấy reviews đã ẩn danh cho tác giả xem (single-blind)
  async getAnonymizedReviewsBySubmission(submissionId: string | number): Promise<
    Array<{
      score: number;
      commentForAuthor: string | null;
      recommendation: string;
      createdAt: Date;
    }>
  > {
    const reviews = await this.getReviewsBySubmission(submissionId, 1, 100);

    return reviews.map((r) => ({
      score: r.score,
      commentForAuthor: r.commentForAuthor,
      recommendation: r.recommendation,
      createdAt: r.createdAt,
    }));
  }

  // Lấy tiến độ review cho một submission
  async getSubmissionProgress(submissionId: string | number): Promise<{
    submissionId: string | number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    reviewsSubmitted: number;
    lastReviewAt: Date | null;
  }> {
    // Ensure submissionId is string (UUID)
    const submissionIdStr = typeof submissionId === 'string' ? submissionId : String(submissionId);
    const assignments = await this.assignmentRepository.find({
      where: { submissionId: submissionIdStr },
    });

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.COMPLETED,
    ).length;
    const pendingAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.PENDING,
    ).length;

    const reviews = await this.getReviewsBySubmission(submissionId, 1, 1000);
    const reviewsSubmitted = reviews.length;
    const lastReviewAt =
      reviews.length > 0
        ? reviews.reduce((latest, r) =>
            r.createdAt > latest ? r.createdAt : latest,
          reviews[0].createdAt)
        : null;

    return {
      submissionId,
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      reviewsSubmitted,
      lastReviewAt,
    };
  }

  // Lấy tiến độ review cho cả hội nghị
  async getConferenceProgress(conferenceId: number): Promise<{
    conferenceId: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    reviewsSubmitted: number;
  }> {
    const assignments = await this.assignmentRepository.find({
      where: { conferenceId },
    });

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.COMPLETED,
    ).length;
    const pendingAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.PENDING,
    ).length;

    const assignmentIds = assignments.map((a) => a.id);
    let reviewsSubmitted = 0;

    if (assignmentIds.length > 0) {
      reviewsSubmitted = await this.reviewRepository.count({
        where: { assignmentId: In(assignmentIds) },
      });
    }

    return {
      conferenceId,
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      reviewsSubmitted,
    };
  }

  // Tổng hợp reviews và quyết định cho một submission
  async getDecisionSummaryBySubmission(submissionId: string | number): Promise<{
    submissionId: string | number;
    stats: {
      reviewCount: number;
      averageScore: number | null;
      minScore: number | null;
      maxScore: number | null;
      recommendationCounts: Record<string, number>;
    };
    decision: Decision | null;
  }> {
    // Ensure submissionId is string (UUID)
    const submissionIdStr = typeof submissionId === 'string' ? submissionId : String(submissionId);
    // Get all reviews for this submission
    const assignments = await this.assignmentRepository.find({
      where: { submissionId: submissionIdStr },
    });

    const assignmentIds = assignments.map((a) => a.id);
    let reviews: Review[] = [];

    if (assignmentIds.length > 0) {
      reviews = await this.reviewRepository.find({
        where: { assignmentId: In(assignmentIds) },
      });
    }

    const reviewCount = reviews.length;
    let averageScore: number | null = null;
    let minScore: number | null = null;
    let maxScore: number | null = null;
    const recommendationCounts: Record<string, number> = {};

    if (reviewCount > 0) {
      const scores = reviews.map((r) => r.score);
      const sum = scores.reduce((acc, v) => acc + v, 0);
      averageScore = sum / reviewCount;
      minScore = Math.min(...scores);
      maxScore = Math.max(...scores);

      for (const r of reviews) {
        const key = r.recommendation;
        recommendationCounts[key] = (recommendationCounts[key] || 0) + 1;
      }
    }

    const decision = await this.decisionRepository.findOne({
      where: { submissionId: submissionIdStr },
    });

    return {
      submissionId,
      stats: {
        reviewCount,
        averageScore,
        minScore,
        maxScore,
        recommendationCounts,
      },
      decision,
    };
  }

  // Tạo hoặc cập nhật quyết định cuối cùng cho submission
  async upsertDecisionForSubmission(
    submissionId: string | number,
    decidedBy: number,
    decisionValue: FinalDecision,
    note?: string,
  ): Promise<Decision> {
    // Ensure submissionId is string (UUID)
    const submissionIdStr = typeof submissionId === 'string' ? submissionId : String(submissionId);
    let decision = await this.decisionRepository.findOne({
      where: { submissionId: submissionIdStr },
    });

    if (!decision) {
      decision = this.decisionRepository.create({
        submissionId: submissionIdStr,
        decision: decisionValue,
        decidedBy,
        note: note ?? null,
      });
    } else {
      decision.decision = decisionValue;
      decision.decidedBy = decidedBy;
      decision.note = note ?? null;
    }

    return this.decisionRepository.save(decision);
  }

  // Lấy submissions cho reviewer trong các track đã chấp nhận
  async getSubmissionsForReviewer(
    reviewerId: number,
    authToken: string,
    status?: string[],
  ): Promise<Submission[]> {
    let acceptedTracks: any[] = [];
    try {
      const trackAssignments = await this.conferenceClient.getMyTrackAssignments(authToken);
      acceptedTracks = trackAssignments.filter(
        (assignment) => assignment.status === 'ACCEPTED',
      );
    } catch (error) {
      return [];
    }

    if (acceptedTracks.length === 0) {
      return [];
    }

    const allSubmissions: Submission[] = [];
    
    for (const trackAssignment of acceptedTracks) {
      try {
        const submissions = await this.submissionClient.getSubmissionsByTrack(
          trackAssignment.trackId,
          authToken,
          undefined,
        );
        
        let filteredSubmissions = submissions;
        if (status && status.length > 0) {
          const statusArray = Array.isArray(status) ? status : [status];
          filteredSubmissions = submissions.filter((s) => statusArray.includes(s.status));
        } else {
          filteredSubmissions = submissions.filter(
            (s) => s.status !== 'DRAFT' && s.status !== 'WITHDRAWN'
          );
        }
        
        allSubmissions.push(...filteredSubmissions);
      } catch (error) {
        // Continue with other tracks even if one fails
      }
    }

    const uniqueSubmissions = Array.from(
      new Map(allSubmissions.map((s) => [s.id, s])).values(),
    );

    return uniqueSubmissions;
  }

  // Lấy thống kê hoạt động reviewer (Guard Clause Case 2)
  async getReviewerActivityStats(reviewerId: number): Promise<{
    assignmentCount: number;
    reviewCount: number;
    hasActiveAssignments: boolean;
    completedReviews: number;
  }> {
    const assignments = await this.assignmentRepository.find({
      where: { reviewerId },
    });

    const assignmentIds = assignments.map(a => a.id);
    const reviews = assignmentIds.length > 0
      ? await this.reviewRepository.find({
          where: { assignmentId: In(assignmentIds) },
        })
      : [];

    return {
      assignmentCount: assignments.length,
      reviewCount: reviews.length,
      hasActiveAssignments: assignments.some(a => 
        a.status === 'PENDING' || a.status === 'ACCEPTED'
      ),
      completedReviews: reviews.length,
    };
  }
}











