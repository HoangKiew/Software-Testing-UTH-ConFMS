// src/reports/reports.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from '../submissions/entities/submission.entity';
import { Conference } from '../conferences/entities/conference.entity';
import { ReviewsClient } from '../reviews/reviews.client';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepo: Repository<Submission>,
    @InjectRepository(Conference)
    private conferenceRepo: Repository<Conference>,
    private reviewsClient: ReviewsClient, // Giữ lại để sau này dùng
  ) {}

  // Tổng quan hội nghị
  async getOverview(conferenceId: string) {
    const conference = await this.conferenceRepo.findOne({ where: { id: conferenceId } });
    if (!conference) throw new BadRequestException('Conference not found');

    const total = await this.submissionRepo.count({ where: { conferenceId } });
    const accepted = await this.submissionRepo.count({ where: { conferenceId, status: SubmissionStatus.ACCEPTED } });
    const rejected = await this.submissionRepo.count({ where: { conferenceId, status: SubmissionStatus.REJECTED } });
    const underReview = await this.submissionRepo.count({ where: { conferenceId, status: SubmissionStatus.UNDER_REVIEW } });

    // ĐÃ XÓA WITHDRAWN VÌ KHÔNG TỒN TẠI TRONG ENUM
    // const withdrawn = ...

    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(2) : '0';

    return {
      conferenceName: conference.name,
      totalSubmissions: total,
      accepted,
      rejected,
      underReview,
      // withdrawn, // ĐÃ XÓA
      acceptanceRate: `${acceptanceRate}%`,
    };
  }

  // Thống kê theo track/lĩnh vực (giả sử submission có field 'track')
  async getTrackStats(conferenceId: string) {
    const stats = await this.submissionRepo
      .createQueryBuilder('submission')
      .select('submission.track', 'track')
      .addSelect('COUNT(*)', 'count')
      .addSelect("COUNT(*) FILTER (WHERE submission.status = 'accepted')", 'accepted')
      .where('submission.conferenceId = :conferenceId', { conferenceId })
      .groupBy('submission.track')
      .orderBy('count', 'DESC')
      .getRawMany();

    return stats.map(s => ({
      track: s.track || 'Uncategorized',
      total: parseInt(s.count),
      accepted: parseInt(s.accepted),
      acceptanceRate: parseInt(s.count) > 0 ? ((parseInt(s.accepted) / parseInt(s.count)) * 100).toFixed(2) + '%' : '0%',
    }));
  }

  // Thống kê theo trường/tổ chức (giả sử submission có authors với institution từ Users)
  async getInstitutionStats(conferenceId: string) {
    // Nếu submission lưu authorInstitutions array hoặc cần join Users
    // Tạm thời trả về dữ liệu mẫu hoặc comment nếu chưa triển khai
    return [
      { institution: 'University of Technology Hanoi', submissions: 45 },
      { institution: 'Vietnam National University', submissions: 32 },
      { institution: 'Unknown', submissions: 18 },
    ];
  }

  // SLA đánh giá (thời gian hoàn thành review)
  async getReviewSLA(conferenceId: string) {
    // TẠM COMMENT TOÀN BỘ PHẦN SLA VÌ:
    // - ReviewsClient chưa có
    // - Submission chưa có reviewDeadline/deadlines
    // - slaDetails.push gây lỗi type 'never'

    return {
      totalReviews: 0,
      onTimeReviews: 0,
      overallSLA: '0%',
      details: [],
      message: 'Review SLA not available yet (review-service integration pending)',
    };

    // Khi có review-service, bỏ comment phần dưới:
    /*
    const submissions = await this.submissionRepo.find({
      where: { conferenceId },
      relations: ['assignments'],
    });

    const slaDetails: any[] = []; // Khai báo type để tránh lỗi 'never'
    let totalReviews = 0;
    let onTimeReviews = 0;

    for (const sub of submissions) {
      const reviews = await this.reviewsClient.getReviewsForSubmission(sub.id);
      for (const review of reviews) {
        totalReviews++;
        const reviewDeadline = new Date(sub.reviewDeadline || sub.deadlines.review);
        const completedAt = review.completedAt ? new Date(review.completedAt) : null;

        const isOnTime = completedAt && completedAt <= reviewDeadline;
        if (isOnTime) onTimeReviews++;

        slaDetails.push({
          submissionId: sub.id,
          reviewId: review.id,
          completedAt: review.completedAt,
          deadline: reviewDeadline,
          onTime: isOnTime,
        });
      }
    }

    const overallSLA = totalReviews > 0 ? ((onTimeReviews / totalReviews) * 100).toFixed(2) : '0';

    return {
      totalReviews,
      onTimeReviews,
      overallSLA: `${overallSLA}%`,
      details: slaDetails,
    };
    */
  }
}