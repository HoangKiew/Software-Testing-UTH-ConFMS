import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Conference } from '../conferences/entities/conference.entity';
import { Track } from '../conferences/entities/track.entity';
import {
  ConferenceMember,
  ConferenceMemberRole,
} from '../conferences/entities/conference-member.entity';
import { TrackMember } from '../conferences/entities/track-member.entity';
import { SubmissionClientService } from '../integrations/submission-client.service';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Conference)
    private conferenceRepository: Repository<Conference>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(ConferenceMember)
    private conferenceMemberRepository: Repository<ConferenceMember>,
    @InjectRepository(TrackMember)
    private trackMemberRepository: Repository<TrackMember>,
    private submissionClient: SubmissionClientService,
  ) {}
  // Lấy thống kê tổng quan của hội nghị
  async getConferenceStats(conferenceId: number): Promise<{
    totalTracks: number;
    totalMembers: number;
    membersByRole: Record<string, number>;
    tracks: Array<{ id: number; name: string }>;
  }> {
    const conference = await this.conferenceRepository.findOne({
      where: {
        id: conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    if (!conference) {
      throw new NotFoundException(
        `Conference với ID ${conferenceId} không tồn tại`,
      );
    }

    const tracks = await this.trackRepository.find({
      where: {
        conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    const members = await this.conferenceMemberRepository.find({
      where: { conferenceId },
    });

    const membersByRole: Record<string, number> = {};
    members.forEach((member) => {
      membersByRole[member.role] = (membersByRole[member.role] || 0) + 1;
    });

    return {
      totalTracks: tracks.length,
      totalMembers: members.length,
      membersByRole,
      tracks: tracks.map((track) => ({
        id: track.id,
        name: track.name,
      })),
    };
  }

  //  Lấy thống kê về submissions
  async getSubmissionStats(
    conferenceId: number,
    authToken: string,
  ): Promise<{
    totalSubmissions: number;
    submissionsByTrack: Array<{
      trackId: number;
      trackName: string;
      count: number;
      accepted: number;
      rejected: number;
    }>;
    submissionsByStatus: Record<string, number>;
    acceptanceRate: number;
    totalAccepted: number;
    totalRejected: number;
  }> {
    try {
      const stats = await this.submissionClient.getSubmissionStatistics(
        conferenceId,
        authToken,
      );
      const tracks = await this.trackRepository.find({
        where: {
          conferenceId,
          deletedAt: IsNull(),
          isActive: true,
        },
      });
      const trackMap = new Map(tracks.map((t) => [t.id, t.name]));

      const submissionsByTrack = stats.submissionsByTrack.map((trackStat) => ({
        ...trackStat,
        trackName:
          trackMap.get(trackStat.trackId) || `Track ${trackStat.trackId}`,
      }));

      return {
        totalSubmissions: stats.totalSubmissions,
        submissionsByTrack,
        submissionsByStatus: stats.submissionsByStatus,
        acceptanceRate: stats.acceptanceRate,
        totalAccepted: stats.totalAccepted,
        totalRejected: stats.totalRejected,
      };
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      if (status !== 502) {
        throw new NotFoundException(
          `Không thể lấy thống kê submissions: ${error.message || 'Lỗi không xác định'}`,
        );
      }
      return {
        totalSubmissions: 0,
        submissionsByTrack: [],
        submissionsByStatus: {},
        acceptanceRate: 0,
        totalAccepted: 0,
        totalRejected: 0,
      };
    }
  }
  // Lấy tỷ lệ chấp nhận
  async getAcceptanceRate(
    conferenceId: number,
    authToken: string,
  ): Promise<{
    acceptanceRate: number;
    totalAccepted: number;
    totalRejected: number;
    totalSubmissions: number;
  }> {
    try {
      const stats = await this.submissionClient.getSubmissionStatistics(
        conferenceId,
        authToken,
      );

      return {
        acceptanceRate: stats.acceptanceRate,
        totalAccepted: stats.totalAccepted,
        totalRejected: stats.totalRejected,
        totalSubmissions: stats.totalSubmissions,
      };
    } catch (error: any) {
      return {
        acceptanceRate: 0,
        totalAccepted: 0,
        totalRejected: 0,
        totalSubmissions: 0,
      };
    }
  }

  // Lấy thống kê dashboard
  async getDashboardStats(
    conferenceId: number,
    authToken: string,
  ): Promise<{
    totalSubmissions: number;
    acceptanceRate: number;
    totalAccepted: number;
    totalRejected: number;
    totalReviewers: number;
    submissionsByTrack: Array<{
      trackId: number;
      trackName: string;
      submissions: number;
      accepted: number;
      rejected: number;
    }>;
    statusDistribution: {
      accepted: number;
      rejected: number;
      reviewing: number;
    };
  }> {
    // Get submission stats
    const submissionStats = await this.getSubmissionStats(
      conferenceId,
      authToken,
    );

    // Get reviewers count - count distinct users from TrackMember with ACCEPTED status
    const tracks = await this.trackRepository.find({
      where: {
        conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
      select: ['id'],
    });
    const trackIds = tracks.map((t) => t.id);
    
    // Count distinct userId from TrackMember with ACCEPTED status in all tracks of this conference
    let totalReviewers = 0;
    if (trackIds.length > 0) {
      const allTrackMembers = await this.trackMemberRepository
        .createQueryBuilder('tm')
        .where('tm.trackId IN (:...trackIds)', { trackIds })
        .andWhere('tm.status = :status', { status: 'ACCEPTED' })
        .getMany();
      
      // Use Set to get distinct userId
      const reviewerUserIds = new Set<number>();
      allTrackMembers.forEach((tm) => reviewerUserIds.add(tm.userId));
      totalReviewers = reviewerUserIds.size;
    }

    // Transform submissionsByTrack: count -> submissions
    const submissionsByTrack = submissionStats.submissionsByTrack.map(
      (track) => ({
        trackId: track.trackId,
        trackName: track.trackName,
        submissions: track.count,
        accepted: track.accepted,
        rejected: track.rejected,
      }),
    );

    // Calculate statusDistribution
    const statusDistribution = {
      accepted: submissionStats.totalAccepted,
      rejected: submissionStats.totalRejected,
      reviewing:
        submissionStats.totalSubmissions -
        submissionStats.totalAccepted -
        submissionStats.totalRejected,
    };

    return {
      totalSubmissions: submissionStats.totalSubmissions,
      acceptanceRate: submissionStats.acceptanceRate,
      totalAccepted: submissionStats.totalAccepted,
      totalRejected: submissionStats.totalRejected,
      totalReviewers: totalReviewers,
      submissionsByTrack,
      statusDistribution,
    };
  }
}
