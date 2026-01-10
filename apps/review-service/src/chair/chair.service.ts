import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Assignment } from '../reviewer/entities/assignment.entity';
import { Review } from '../reviewer/entities/review.entity';
import { DiscussionMessage } from '../reviewer/entities/discussion.entity';
import { ChairDecision } from './entities/decision.entity';

@Injectable()
export class ChairService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(DiscussionMessage)
    private readonly discussionRepo: Repository<DiscussionMessage>,
    @InjectRepository(ChairDecision)
    private readonly decisionRepo: Repository<ChairDecision>,
  ) {}

  /**
   * Trả về tổng hợp các đánh giá, phân công và thảo luận cho một submission
   */
  async getSubmissionSummary(submissionId: string) {
    const assignments = await this.assignmentRepo.find({ where: { submissionId } });

    const assignmentIds = assignments.map((a) => a.id);
    const reviews = assignmentIds.length
      ? await this.reviewRepo.find({ where: { assignmentId: In(assignmentIds) } })
      : [];

    const discussions = await this.discussionRepo.find({ where: { submissionId }, order: { createdAt: 'ASC' } });

    const decisions = await this.decisionRepo.find({ where: { submissionId }, order: { createdAt: 'DESC' } });

    return {
      submissionId,
      assignments,
      reviews,
      discussions,
      decisions,
    };
  }

  async getDecision(submissionId: string) {
    return this.decisionRepo.find({ where: { submissionId }, order: { createdAt: 'DESC' } });
  }

  /** Trả về các quyết định (unique theo submissionId) do chair thực hiện; nếu cung cấp `decision` thì lọc theo giá trị */
  async listDecisionsByChair(chairId: number, decision?: 'accepted' | 'rejected') {
    const where: any = { chairId };
    if (decision) where.decision = decision;

    const rows = await this.decisionRepo.find({ where, order: { createdAt: 'DESC' } });
    // dedupe by submissionId, keep latest per submission
    const map = new Map<string, ChairDecision>();
    for (const r of rows) {
      if (!map.has(r.submissionId)) map.set(r.submissionId, r);
    }
    return Array.from(map.values());
  }

  /**
   * Trả về danh sách submission cần chair quyết định: những submission có ít nhất 1 final review
   * nhưng chưa có bất kỳ ChairDecision nào do chair đó đưa ra.
   */
  async listPendingDecisions(chairId: number) {
    // 1) find all reviews that are final
    const finalReviews = await this.reviewRepo.find({ where: { isFinal: true } });
    if (!finalReviews || finalReviews.length === 0) return [];

    // 2) collect assignmentIds -> fetch assignments to get submissionIds
    const assignmentIds = Array.from(new Set(finalReviews.map(r => r.assignmentId)));
    const assignments = await this.assignmentRepo.find({ where: { id: In(assignmentIds) } });
    const submissionIds = Array.from(new Set(assignments.map(a => a.submissionId)));

    if (submissionIds.length === 0) return [];

    // 3) find submissions that this chair already decided
    const decided = await this.decisionRepo.find({ where: { chairId } });
    const decidedSet = new Set(decided.map(d => d.submissionId));

    // 4) pending = submissionIds - decidedSet
    const pending = submissionIds.filter(sid => !decidedSet.has(sid));
    return pending;
  }

  /**
   * Create a new chair decision entry (history) and propagate to reviews that have isFinal = true.
   * Only allowed when there is at least one final review for the submission.
   */
  async upsertDecision(submissionId: string, chairId: number, payload: Partial<ChairDecision>) {
    // Find assignments for submission
    const assignments = await this.assignmentRepo.find({ where: { submissionId } });
    const assignmentIds = assignments.map((a) => a.id);

    // Find final reviews for these assignments
    const finalReviews = assignmentIds.length
      ? await this.reviewRepo.find({ where: { assignmentId: In(assignmentIds), isFinal: true } })
      : [];

    if (!finalReviews || finalReviews.length === 0) {
      throw new BadRequestException('Cannot decide on submission without any final reviews from reviewers');
    }

    // Create per-reviewer ChairDecision rows (history) and propagate
    const createdDecisions = [] as ChairDecision[];
    const decisionValue = payload.decision as 'accepted' | 'rejected';

    for (const r of finalReviews) {
      const cd = this.decisionRepo.create({
        submissionId,
        chairId,
        reviewerId: r.reviewerId,
        decision: decisionValue,
        note: payload.note,
      });
      const saved = await this.decisionRepo.save(cd);
      createdDecisions.push(saved);

      // propagate to review row
      r.chairDecision = decisionValue;
      await this.reviewRepo.save(r);
    }

    return { createdDecisions, updatedReviews: finalReviews.length };
  }

  async removeDecision(submissionId: string) {
    const d = await this.decisionRepo.findOne({ where: { submissionId } });
    if (!d) throw new NotFoundException('Decision not found');
    return this.decisionRepo.remove(d);
  }
}
