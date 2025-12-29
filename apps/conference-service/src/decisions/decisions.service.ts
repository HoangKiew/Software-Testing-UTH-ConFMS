// src/decisions/decisions.service.ts
import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decision, DecisionType } from './entities/decision.entity';
import { EmailsService } from '../emails/emails.service';
import { ConferencesService } from '../conferences/conferences.service';
import { AuditService } from '../audit/audit.service';
import { ReviewsClient } from '../reviews/reviews.client';
import { MakeDecisionDto } from './dto/make-decision.dto';
import { BulkDecisionDto } from './dto/bulk-decision.dto';
import { SubmissionsClient } from '../integrations/submissions.client';

enum SubmissionStatus {
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Injectable()
export class DecisionsService {
  constructor(
    @InjectRepository(Decision)
    private decisionRepo: Repository<Decision>,
    private emailsService: EmailsService,
    private conferencesService: ConferencesService,
    private auditService: AuditService,
    private reviewsClient: ReviewsClient,
    private submissionsClient: SubmissionsClient,
  ) {}

  async getSummaryForConference(conferenceId: string, chairId: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    if (conference.chairId !== chairId) {
      throw new ForbiddenException('Only chair can view summary');
    }

    const submissions =
      await this.submissionsClient.getSubmissionsByConference(conferenceId);

    return submissions.map((submission) => ({
      submissionId: submission.id,
      title: submission.title,
      averageScore: 0,
      reviewCount: 0,
      comments: 'Reviews not available yet (review-service pending)',
      currentDecision: submission.status,
    }));
  }

  async makeDecision(dto: MakeDecisionDto, chairId: number) {
    const submission = await this.submissionsClient.getSubmission(dto.submissionId);
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

    // TODO: cập nhật status submission qua submission-service
    // await this.submissionsClient.updateStatus(dto.submissionId, dto.decision);

    const emails = ['author@example.com'];

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
    const results: any[] = [];

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

    const submissions =
      await this.submissionsClient.getSubmissionsByConference(conferenceId);

    const results: any[] = [];

    for (const submission of submissions) {
      if (submission.status !== SubmissionStatus.UNDER_REVIEW) continue;

      const averageScore = 0;
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
