import { Injectable, NotFoundException } from '@nestjs/common';
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

    const decision = await this.decisionRepo.findOne({ where: { submissionId } });

    return {
      submissionId,
      assignments,
      reviews,
      discussions,
      decision,
    };
  }

  async getDecision(submissionId: string) {
    return this.decisionRepo.findOne({ where: { submissionId } });
  }

  async upsertDecision(submissionId: string, chairId: number, payload: Partial<ChairDecision>) {
    let d = await this.decisionRepo.findOne({ where: { submissionId } });
    if (!d) {
      d = this.decisionRepo.create({ submissionId, chairId, decision: payload.decision as any, note: payload.note });
    } else {
      d.decision = payload.decision as any;
      d.note = payload.note;
      d.chairId = chairId;
    }
    return this.decisionRepo.save(d);
  }

  async removeDecision(submissionId: string) {
    const d = await this.decisionRepo.findOne({ where: { submissionId } });
    if (!d) throw new NotFoundException('Decision not found');
    return this.decisionRepo.remove(d);
  }
}
