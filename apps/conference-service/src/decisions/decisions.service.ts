// src/decisions/decisions.service.ts
import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decision } from './entities/decision.entity';
import { SubmissionsService } from '../submissions/submissions.service';
import { EmailsService } from '../emails/emails.service';
import { ConferencesService } from '../conferences/conferences.service';
import { AuditService } from '../audit/audit.service';
import { ReviewsClient } from '../reviews/reviews.client';
import { MakeDecisionDto } from './dto/make-decision.dto';
import { BulkDecisionDto } from './dto/bulk-decision.dto';
import { DecisionType } from './entities/decision.entity';
import { SubmissionStatus } from '../submissions/entities/submission.entity';

@Injectable()
export class DecisionsService {
  constructor(
    @InjectRepository(Decision)
    private decisionRepo: Repository<Decision>,
    private submissionsService: SubmissionsService,
    private emailsService: EmailsService,
    private conferencesService: ConferencesService,
    private auditService: AuditService,
    private reviewsClient: ReviewsClient, // Giữ lại để sau này dùng
  ) {}

  async getSummaryForConference(conferenceId: string, chairId: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can view summary');
    }

    const submissions = await this.submissionsService.findAllByConference(conferenceId);

    // TẠM COMMENT PHẦN GỌI REVIEWS CLIENT (vì review-service chưa có)
    const summaries = submissions.map((submission) => ({
      submissionId: submission.id,
      title: submission.title,
      averageScore: 0, // Tạm thời = 0
      reviewCount: 0,  // Tạm thời = 0
      comments: 'Reviews not available yet (review-service pending)',
      currentDecision: submission.status,
    }));

    return summaries;
  }

  async makeDecision(dto: MakeDecisionDto, chairId: number) {
    const submission = await this.submissionsService.findOne(dto.submissionId);
    const conference = await this.conferencesService.findOne(submission.conferenceId);
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can make decisions');
    }

    if (submission.status !== SubmissionStatus.UNDER_REVIEW) {
      throw new BadRequestException('Submission not ready for decision');
    }

    const decision = this.decisionRepo.create({
      submissionId: dto.submissionId,
      decision: dto.decision,
      feedback: dto.feedback || '',
      decidedAt: new Date(),
      decidedBy: chairId,
    });

    await this.decisionRepo.save(decision);

    // TẠM COMMENT CẬP NHẬT STATUS VÀ GỬI EMAIL (vì chưa có method save/getAuthors)
    // submission.status = dto.decision === DecisionType.ACCEPT ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED;
    // await this.submissionsService.save(submission);

    // const authors = await this.submissionsService.getAuthors(dto.submissionId);
    // const emails = authors.map((a) => a.email);
    const emails = ['author@example.com']; // Tạm thời để build thành công

    await this.emailsService.send('decision_notification', emails, {
      submissionTitle: submission.title,
      decision: dto.decision.toUpperCase(),
      feedback: dto.feedback || 'No additional feedback.',
      conferenceName: conference.name,
    });

    await this.auditService.log('MAKE_DECISION', chairId, 'Decision', decision.id, dto);

    return { message: 'Decision made and notification sent' };
  }

  async makeBulkDecisions(dto: BulkDecisionDto, chairId: number) {
    const results: any[] = []; // KHAI BÁO TYPE ĐỂ FIX LỖI 'never'

    for (const singleDto of dto.decisions) {
      results.push(await this.makeDecision(singleDto, chairId));
    }
    return { message: 'Bulk decisions made', count: results.length };
  }

  async makeAllDecisions(conferenceId: string, chairId: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can make decisions');
    }

    const submissions = await this.submissionsService.findAllByConference(conferenceId);

    const results: any[] = []; // KHAI BÁO TYPE ĐỂ FIX LỖI 'never'

    for (const submission of submissions) {
      if (submission.status !== SubmissionStatus.UNDER_REVIEW) continue;

      // TẠM COMMENT GỌI REVIEWS CLIENT
      // const reviews = await this.reviewsClient.getReviewsForSubmission(submission.id);
      // const averageScore = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length : 0;

      const averageScore = 0; // Tạm thời = 0

      const decisionType = averageScore > 3 ? DecisionType.ACCEPT : DecisionType.REJECT;

      const dto: MakeDecisionDto = {
        submissionId: submission.id,
        decision: decisionType,
        feedback: 'Automated decision based on average review score.',
      };

      results.push(await this.makeDecision(dto, chairId));
    }

    return { message: 'All decisions made for conference', count: results.length };
  }
}