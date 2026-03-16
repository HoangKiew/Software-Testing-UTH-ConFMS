// apps/conference-service/src/decisions/decisions.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Decision, DecisionType } from './entities/decision.entity';
import { EmailsService } from '../emails/emails.service';
import { ConferencesService } from '../conferences/conferences.service';
import { AuditService } from '../audit/audit.service';
import { ReviewsClient } from '../reviews/reviews.client';
import { SubmissionsClient, Submission } from '../integrations/submissions.client';
import { MakeDecisionDto } from './dto/make-decision.dto';
import { BulkDecisionDto } from './dto/bulk-decision.dto';

enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  WITHDRAWN = 'WITHDRAWN',
}

interface DecisionSummaryItem {
  submissionId: string;
  title: string;
  averageScore: string;
  reviewCount: number;
  comments: string;
  currentStatus?: string;
  readyForDecision: boolean;
}

interface DecisionResult {
  message: string;
  decisionId?: string;
  submissionId: string;
  newStatus?: SubmissionStatus;
  status: 'success' | 'failed';
  error?: string;
}

@Injectable()
export class DecisionsService {
  private readonly logger = new Logger(DecisionsService.name);

  private readonly STATUS_MAP: Record<DecisionType, SubmissionStatus> = {
    [DecisionType.ACCEPT]: SubmissionStatus.ACCEPTED,
    [DecisionType.REJECT]: SubmissionStatus.REJECTED,
    [DecisionType.REVISE]: SubmissionStatus.REVISION_REQUIRED,
    [DecisionType.WITHDRAW]: SubmissionStatus.WITHDRAWN,
  };

  constructor(
    @InjectRepository(Decision) private readonly decisionRepo: Repository<Decision>,
    private readonly dataSource: DataSource,
    private readonly emailsService: EmailsService,
    private readonly conferencesService: ConferencesService,
    private readonly auditService: AuditService,
    private readonly reviewsClient: ReviewsClient,
    private readonly submissionsClient: SubmissionsClient,
  ) {}

  private async checkUserCanDecideOnConference(
    conferenceId: string,
    userId: number,
    userRoles: string[],
  ): Promise<void> {
    if (userRoles.includes('ADMIN')) return;
    const conference = await this.conferencesService.findOne(Number(conferenceId));
    if (!conference) throw new NotFoundException(`Conference ${conferenceId} not found`);
    if (conference.organizerId !== userId) throw new ForbiddenException('Only chair or ADMIN can perform this action');
  }

  private async getSubmissionOrThrow(submissionId: string): Promise<Submission> {
    const submission = await this.submissionsClient.getSubmission(submissionId);
    if (!submission) throw new NotFoundException(`Submission ${submissionId} not found`);
    if (!submission.conference_id) throw new BadRequestException(`Submission ${submissionId} has no conferenceId`);
    return submission;
  }

  private extractAuthorEmails(authors: any[]): string[] {
    return (authors ?? []).filter(a => typeof a?.email === 'string').map(a => a.email);
  }

  async getSummaryForConference(
    conferenceId: string,
    userId: number,
    userRoles: string[],
  ): Promise<{ conferenceId: string; conferenceTitle: string; totalSubmissions: number; summary: DecisionSummaryItem[] }> {
    await this.checkUserCanDecideOnConference(conferenceId, userId, userRoles);

    const paginated = await this.submissionsClient.getSubmissionsPaginated(
      conferenceId,
      1,
      500,
      SubmissionStatus.UNDER_REVIEW
    );

    const submissions = paginated?.data ?? [];
    const total = paginated?.pagination?.total ?? submissions.length;

    const summary = await Promise.all(
      submissions.map(async (submission) => {
        if (!submission?.id) return null;

        let avgScore = 0;
        let reviewCount = 0;
        let comments = 'Chưa có đánh giá';

        try {
          const agg = await this.reviewsClient.getAggregatedScores(String(submission.id));
          avgScore = agg?.avgScore ?? 0;
          reviewCount = agg?.reviewerCount ?? 0;
          comments = agg?.comments?.join(' | ') ?? 'Không có comment';
        } catch {}

        return {
          submissionId: String(submission.id),
          title: submission.title ?? 'Chưa có tiêu đề',
          averageScore: avgScore.toFixed(2),
          reviewCount,
          comments,
          currentStatus: submission.status,
          readyForDecision: true,
        };
      })
    ).then(results => results.filter(item => item !== null));

    const conference = await this.conferencesService.findOne(Number(conferenceId));
    if (!conference) throw new NotFoundException(`Conference ${conferenceId} not found`);

    return {
      conferenceId,
      conferenceTitle: conference.name ?? 'Hội nghị chưa đặt tên',
      totalSubmissions: total,
      summary,
    };
  }

  async makeDecision(dto: MakeDecisionDto, userId: number, userRoles: string[]): Promise<DecisionResult> {
    const submission = await this.getSubmissionOrThrow(dto.submissionId);

    await this.checkUserCanDecideOnConference(String(submission.conference_id!), userId, userRoles);

    if (submission.status?.toUpperCase() !== SubmissionStatus.UNDER_REVIEW) {
      throw new BadRequestException('Submission must be in UNDER_REVIEW status');
    }

    if (await this.decisionRepo.findOne({ where: { submissionId: dto.submissionId } })) {
      throw new BadRequestException(`Decision already exists for submission ${dto.submissionId}`);
    }

    let avgScore = 0;
    try {
      const agg = await this.reviewsClient.getAggregatedScores(dto.submissionId);
      avgScore = agg?.avgScore ?? 0;
    } catch {}

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const decision = this.decisionRepo.create({
        submissionId: dto.submissionId,
        decision: dto.decision.toLowerCase() as DecisionType,
        feedback: dto.feedback ?? `Average review score: ${avgScore.toFixed(2)}`,
        decidedAt: new Date(),
        decidedBy: userId,
      });
      await queryRunner.manager.save(decision);

      const newStatus = this.STATUS_MAP[dto.decision.toLowerCase() as DecisionType] ?? SubmissionStatus.UNDER_REVIEW;

      await this.submissionsClient.updateSubmissionStatus(dto.submissionId, newStatus);

      const authorEmails = this.extractAuthorEmails(submission.authors ?? []);
      await this.emailsService.send('decision_notification', authorEmails.length ? authorEmails : ['default@author.com'], {
        submissionTitle: submission.title ?? 'Chưa có tiêu đề',
        decision: dto.decision.toUpperCase(),
        feedback: dto.feedback ?? 'No additional feedback',
        conferenceName: (await this.conferencesService.findOne(Number(submission.conference_id!)))?.name ?? 'Conference',
      });

      await this.auditService.log(Number(submission.conference_id), userId, 'MAKE_DECISION', 'Decision', Number(decision.id) || null, null, dto as any);

      await queryRunner.commitTransaction();

      return {
        message: 'Decision completed successfully',
        decisionId: decision.id,
        submissionId: dto.submissionId,
        newStatus,
        status: 'success',
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async makeBulkDecisions(dto: BulkDecisionDto, userId: number, userRoles: string[]): Promise<{
    message: string;
    total: number;
    success: number;
    failed: number;
    details: DecisionResult[];
  }> {
    const results = await Promise.all(
      dto.decisions.map(async (singleDto) => {
        try {
          const result = await this.makeDecision(singleDto, userId, userRoles);
          return {
            ...result,
            status: 'success' as const,
            message: 'Decision completed successfully',  // Fix type error: thêm message cho success case
          };
        } catch (err: any) {
          return {
            message: 'Decision failed',
            submissionId: singleDto.submissionId,
            status: 'failed' as const,
            error: err.message || 'Unknown error',
          };
        }
      }),
    );

    const success = results.filter(r => r.status === 'success').length;

    return {
      message: 'Bulk decision process completed',
      total: dto.decisions.length,
      success,
      failed: dto.decisions.length - success,
      details: results,
    };
  }

  async makeAllDecisions(conferenceId: string, userId: number, userRoles: string[]): Promise<{
    message: string;
    totalProcessed: number;
    success: number;
    failed: number;
  }> {
    await this.checkUserCanDecideOnConference(conferenceId, userId, userRoles);

    const paginated = await this.submissionsClient.getSubmissionsPaginated(
      conferenceId,
      1,
      500,
      SubmissionStatus.UNDER_REVIEW
    );

    const underReview = paginated.data.filter(s => s?.status?.toUpperCase() === SubmissionStatus.UNDER_REVIEW);

    if (underReview.length === 0) {
      return { message: 'No submissions ready for auto decision', totalProcessed: 0, success: 0, failed: 0 };
    }

    const results = await Promise.all(
      underReview.map(async (submission) => {
        if (!submission?.id) return { submissionId: 'invalid', status: 'failed' as const, error: 'Missing id' };

        try {
          const agg = await this.reviewsClient.getAggregatedScores(String(submission.id));
          const avgScore = agg?.avgScore ?? 0;
          const decisionType = avgScore >= 3.5 ? DecisionType.ACCEPT : DecisionType.REJECT;

          const dto: MakeDecisionDto = {
            submissionId: String(submission.id),
            decision: decisionType,
            feedback: `Auto decision: Avg score ${avgScore.toFixed(2)}`,
          };

          await this.makeDecision(dto, userId, userRoles);
          return { submissionId: dto.submissionId, status: 'success' as const };
        } catch (err: any) {
          return { submissionId: String(submission.id), status: 'failed' as const, error: err.message };
        }
      }),
    );

    const success = results.filter(r => r.status === 'success').length;

    return {
      message: 'Auto decision process completed',
      totalProcessed: underReview.length,
      success,
      failed: underReview.length - success,
    };
  }
}