// apps/conference-service/src/reports/reports.service.ts
import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';

import { Conference } from '../conferences/entities/conference.entity';
import { ReviewsClient } from '../reviews/reviews.client';
import { SubmissionsClient, Submission } from '../integrations/submissions.client';

interface ReportOverview {
  conference: {
    id: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
  };
  submissions: {
    total: number;
    byStatus: Record<string, number>;
    acceptanceRate: string;
  };
  reviews: {
    total: number;
    averageScore: string;
    onTime: number;
    slaPercentage: string;
  };
  generatedAt: string;
}

interface SubmissionStats {
  totalSubmissions: number;
  byStatus: Record<string, number>;
  acceptanceRate: string;
  note?: string;
}

interface ReviewerStats {
  totalReviews: number;
  averageScore: string;
  totalReviewers: number;
  note?: string;
}

interface ReviewSLAReport {
  totalReviews: number;
  onTimeReviews: number;
  slaPercentage: string;
  details?: Array<{ submissionId: string; reviewerId: string; daysLate: number }>;
  note?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly STATUS_LIST = [
    'SUBMITTED',          // ← Thêm để khớp submission-service (đang có 3 bài SUBMITTED)
    'ACCEPTED',
    'REJECTED',
    'UNDER_REVIEW',
    'WITHDRAWN',
    'PENDING',
  ];

  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepo: Repository<Conference>,
    private readonly reviewsClient: ReviewsClient,
    private readonly submissionsClient: SubmissionsClient,
  ) { }

  private async getConferenceOrThrow(conferenceId: string): Promise<Conference> {
    const conference = await this.conferenceRepo.findOne({ where: { id: conferenceId } });
    if (!conference) {
      throw new NotFoundException(`Conference with ID ${conferenceId} not found`);
    }
    return conference;
  }

  private calculatePercentage(numerator: number, denominator: number): string {
    return denominator > 0 ? ((numerator / denominator) * 100).toFixed(1) + '%' : '0.0%';
  }

  async getOverview(conferenceId: string): Promise<ReportOverview> {
    const conference = await this.getConferenceOrThrow(conferenceId);

    const counts = await Promise.allSettled([
      this.submissionsClient.countSubmissions(conferenceId),
      ...this.STATUS_LIST.map(status =>
        this.submissionsClient.countSubmissionsByStatus(conferenceId, status),
      ),
      this.reviewsClient.countReviewsByConference(conferenceId),
      this.reviewsClient.getAverageScoreByConference(conferenceId),
      this.reviewsClient.countOnTimeReviewsByConference(conferenceId),
    ]);

    const [
      totalSub = 0,
      submitted = 0,   // ← Map SUBMITTED vào pending hoặc submitted
      accepted = 0,
      rejected = 0,
      underReview = 0,
      withdrawn = 0,
      pending = 0,
      totalReviews = 0,
      avgScore = 0,
      onTimeReviews = 0,
    ] = counts.map(r => (r.status === 'fulfilled' ? r.value : 0));

    const byStatus = {
      pending: pending + submitted,  // ← Kết hợp SUBMITTED vào pending
      underReview,
      accepted,
      rejected,
      withdrawn,
    };

    return {
      conference: {
        id: conferenceId,
        name: conference.name ?? 'Unnamed Conference',
        startDate: conference.startDate,
        endDate: conference.endDate,
      },
      submissions: {
        total: totalSub,
        byStatus,
        acceptanceRate: this.calculatePercentage(accepted, totalSub),
      },
      reviews: {
        total: totalReviews,
        averageScore: avgScore.toFixed(2),
        onTime: onTimeReviews,
        slaPercentage: this.calculatePercentage(onTimeReviews, totalReviews),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getSubmissionStats(conferenceId: string): Promise<SubmissionStats> {
    await this.getConferenceOrThrow(conferenceId);

    const [total, ...statusCounts] = await Promise.all([
      this.submissionsClient.countSubmissions(conferenceId),
      ...this.STATUS_LIST.map(s => this.submissionsClient.countSubmissionsByStatus(conferenceId, s)),
    ]);

    const byStatus = Object.fromEntries(
      this.STATUS_LIST.map((status, i) => [status.toLowerCase(), statusCounts[i] ?? 0]),
    );

    // Map SUBMITTED vào pending nếu cần
    byStatus.pending = (byStatus.pending ?? 0) + (byStatus.submitted ?? 0);

    return {
      totalSubmissions: total,
      byStatus,
      acceptanceRate: this.calculatePercentage(byStatus.accepted ?? 0, total),
      note: 'Topic/track breakdown coming soon – requires submission-service filter support',
    };
  }

  async getReviewerStats(conferenceId: string): Promise<ReviewerStats> {
    await this.getConferenceOrThrow(conferenceId);

    const [totalReviews, averageScore] = await Promise.all([
      this.reviewsClient.countReviewsByConference(conferenceId),
      this.reviewsClient.getAverageScoreByConference(conferenceId),
    ]);

    const totalReviewers = 0; // TODO: Implement in ReviewsClient

    return {
      totalReviews,
      averageScore: averageScore.toFixed(2),
      totalReviewers,
      note: totalReviewers === 0 ? 'Reviewer distribution not yet implemented' : undefined,
    };
  }

  async getReviewSLA(conferenceId: string): Promise<ReviewSLAReport> {
    await this.getConferenceOrThrow(conferenceId);

    const [totalReviews, onTimeReviews] = await Promise.all([
      this.reviewsClient.countReviewsByConference(conferenceId),
      this.reviewsClient.countOnTimeReviewsByConference(conferenceId),
    ]);

    const details: ReviewSLAReport['details'] = [];

    return {
      totalReviews,
      onTimeReviews,
      slaPercentage: this.calculatePercentage(onTimeReviews, totalReviews),
      details,
      note: details.length === 0 ? 'Detailed SLA breakdown coming soon' : undefined,
    };
  }

  private formatAuthors(authors: any[]): string {
    return (authors ?? [])
      .map(a => (typeof a === 'string' ? a : a?.name ?? a?.email ?? 'Unknown'))
      .filter(Boolean)
      .join(', ') || 'N/A';
  }

  async exportProceedingsPdf(conferenceId: string): Promise<Buffer> {
    const conference = await this.getConferenceOrThrow(conferenceId);

    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'portrait' });
    const buffers: Buffer[] = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('error', err => this.logger.error('PDF generation error', err));

    doc
      .fontSize(22)
      .text(`Proceedings of ${conference.name || 'Conference'}`, { align: 'center' })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Exported on ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' })
      .moveDown(2);

    let index = 1;
    let totalPapers = 0;

    for await (const batch of this.submissionsClient.getAcceptedSubmissionsGenerator(conferenceId, 500)) {
      totalPapers += batch.length;

      for (const paper of batch) {
        if (index > 1 && (index - 1) % 4 === 0) doc.addPage();

        doc
          .fontSize(16)
          .text(`Paper ${index}: ${paper.title || 'Untitled'}`, { continued: true })
          .moveDown(0.8);

        doc
          .fontSize(12)
          .text(`Authors: ${this.formatAuthors(paper.authors ?? [])}`)
          .moveDown(0.5);

        const abstractText = String(paper.abstract ?? '');
        if (abstractText.trim()) {
          doc
            .fontSize(11)
            .text('Abstract:', { underline: true })
            .text(abstractText, { align: 'justify' })
            .moveDown(1.5);
        }

        index++;
      }
    }

    if (totalPapers === 0) {
      throw new BadRequestException('No accepted papers found for this conference');
    }

    if (totalPapers > 800) {
      this.logger.warn(`Large PDF export: ${totalPapers} papers for conference ${conferenceId}`);
    }

    doc.fontSize(9).text(
      `Generated by UTH ConfMS • ${new Date().toISOString().split('T')[0]} • ${totalPapers} papers`,
      50,
      doc.page.height - 40,
      { align: 'center' },
    );

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }

  async exportProceedingsCsv(conferenceId: string): Promise<{ filename: string; content: string }> {
    await this.getConferenceOrThrow(conferenceId);

    const records: any[] = [];
    let totalPapers = 0;

    for await (const batch of this.submissionsClient.getAcceptedSubmissionsGenerator(conferenceId, 1000)) {
      totalPapers += batch.length;

      const batchRecords = batch.map(p => ({
        id: p.id,
        title: p.title ?? '',
        authors: this.formatAuthors(p.authors ?? []),
        abstract: String(p.abstract ?? '').replace(/\n/g, ' ').trim(),
        topics: (p.topics ?? []).join('; '),  // ← Đã an toàn vì có topics?: string[]
      }));

      records.push(...batchRecords);
    }

    if (totalPapers === 0) {
      throw new BadRequestException('No accepted papers to export');
    }

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'Submission ID' },
        { id: 'title', title: 'Title' },
        { id: 'authors', title: 'Authors' },
        { id: 'abstract', title: 'Abstract' },
        { id: 'topics', title: 'Topics' },
      ],
    });

    const csvContent =
      '\uFEFF' +
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(records);

    const today = new Date().toISOString().split('T')[0];
    return {
      filename: `proceedings_${conferenceId.replace(/[^a-zA-Z0-9]/g, '_')}_${today}.csv`,
      content: csvContent,
    };
  }
}