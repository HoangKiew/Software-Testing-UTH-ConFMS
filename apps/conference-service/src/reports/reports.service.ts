// src/reports/reports.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conference } from '../conferences/entities/conference.entity';
import { ReviewsClient } from '../reviews/reviews.client';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Conference)
    private conferenceRepo: Repository<Conference>,
    private reviewsClient: ReviewsClient, // giữ để sau này dùng
  ) {}

  // ===== OVERVIEW =====
  async getOverview(conferenceId: string) {
    const conference = await this.conferenceRepo.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new BadRequestException('Conference not found');
    }

    /**
     * ⚠️ TẠM THỜI
     * Vì reports-service KHÔNG được query submissions DB, sẽ gọi submissions-client sau
     */
    const submissions = 100;
    const accepted = 30;
    const rejected = 20;
    const underReview = submissions - accepted - rejected;
    const acceptanceRate = ((accepted / submissions) * 100).toFixed(1);

    return {
      totalSubmissions: submissions,
      accepted,
      rejected,
      underReview,
      acceptanceRate: `${acceptanceRate}%`,
    };
  }

  // ===== TRACK STATS (CHƯA TÍCH HỢP) =====
  async getTrackStats(conferenceId: string) {
    return {
      message:
        'Track statistics not available yet (submissions-service integration pending)',
      data: [],
    };
  }

  // ===== INSTITUTION STATS (CHƯA TÍCH HỢP) =====
  async getInstitutionStats(conferenceId: string) {
    return {
      message:
        'Institution statistics not available yet (users/submissions integration pending)',
      data: [],
    };
  }

  // ===== REVIEW SLA (CHƯA TÍCH HỢP) =====
  async getReviewSLA(conferenceId: string) {
    return {
      totalReviews: 0,
      onTimeReviews: 0,
      overallSLA: '0%',
      details: [],
      message: 'Review SLA not available yet (review-service pending)',
    };
  }

  // ✅ Added: Stub for PDF export (returns dummy Buffer)
  async exportProceedingsPdf(conferenceId: string): Promise<Buffer> {
    const conference = await this.conferenceRepo.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new BadRequestException('Conference not found');
    }

    // TODO: Integrate with submissions-client to get accepted papers and generate real PDF
    // For now, return dummy PDF content
    return Buffer.from('Dummy PDF content for proceedings');
  }

  // ✅ Added: Stub for CSV export (returns dummy CSV string)
  async exportProceedingsCsv(conferenceId: string): Promise<{ filename: string; data: string }> {
    const conference = await this.conferenceRepo.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new BadRequestException('Conference not found');
    }

    // TODO: Integrate with submissions-client to get accepted papers and generate real CSV
    // For now, return dummy CSV content
    const csvData = 'id,title,authors\n1,Mock Paper,"Author1, Author2"\n2,Another Paper,"Author3"';
    return {
      filename: `proceedings_${conferenceId}.csv`,
      data: csvData,
    };
  }
}