import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Submission {
  id: string;
  title: string;
  abstract: string;
  keywords?: string;
  authorId: number;
  authorName?: string;
  trackId: number;
  conferenceId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

@Injectable()
export class SubmissionClientService {
  private readonly submissionServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.SUBMISSION_SERVICE_URL?.includes('submission-service');
    
    this.submissionServiceUrl =
      this.configService.get<string>('SUBMISSION_SERVICE_URL') ||
      (isDocker 
        ? 'http://submission-service:3003/api' 
        : 'http://localhost:3003/api');
  }
  
  // Lấy danh sách submissions theo conferenceId 
  async getSubmissionsByConference(
    conferenceId: number,
    authToken: string,
    trackId?: number,
    status?: string,
  ): Promise<Submission[]> {
    try {
      const params: Record<string, any> = { conferenceId };
      if (trackId) params.trackId = trackId;
      if (status) params.status = status;

      const response = await firstValueFrom(
        this.httpService.get(`${this.submissionServiceUrl}/submissions`, {
          params,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );

      return response.data?.data || [];
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy danh sách submissions';
      if (status === HttpStatus.BAD_GATEWAY || !status) {
        throw new HttpException(
          {
            message: 'Không thể lấy danh sách submissions. Submission-service đang không khả dụng. Vui lòng thử lại sau hoặc liên hệ admin.',
            detail: {
              conferenceId,
              service: 'submission-service',
              reason: 'Service unavailable or timeout',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        `Submission-service error: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
  // Lấy thống kê submissions theo conferenceId
  async getSubmissionStatistics(
    conferenceId: number,
    authToken: string,
  ): Promise<{
    totalSubmissions: number;
    submissionsByTrack: Array<{ trackId: number; trackName: string; count: number; accepted: number; rejected: number }>;
    submissionsByStatus: Record<string, number>;
    acceptanceRate: number;
    totalAccepted: number;
    totalRejected: number;
  }> {
    try {
      const submissions = await this.getSubmissionsByConference(
        conferenceId,
        authToken,
      );

      const submissionsByStatus: Record<string, number> = {};
      const submissionsByTrackMap = new Map<
        number,
        { trackName: string; count: number; accepted: number; rejected: number }
      >();

      let totalAccepted = 0;
      let totalRejected = 0;

      submissions.forEach((submission) => {
        submissionsByStatus[submission.status] =
          (submissionsByStatus[submission.status] || 0) + 1;

        if (!submissionsByTrackMap.has(submission.trackId)) {
          submissionsByTrackMap.set(submission.trackId, {
            trackName: `Track ${submission.trackId}`,
            count: 0,
            accepted: 0,
            rejected: 0,
          });
        }

        const trackStat = submissionsByTrackMap.get(submission.trackId)!;
        trackStat.count += 1;

        // Consider both ACCEPTED and CAMERA_READY as accepted submissions
        if (submission.status === 'ACCEPTED' || submission.status === 'CAMERA_READY') {
          trackStat.accepted += 1;
          totalAccepted += 1;
        } else if (submission.status === 'REJECTED') {
          trackStat.rejected += 1;
          totalRejected += 1;
        }
      });

      const totalSubmissions = submissions.length;
      const acceptanceRate =
        totalSubmissions > 0
          ? (totalAccepted / totalSubmissions) * 100
          : 0;

      const submissionsByTrack = Array.from(
        submissionsByTrackMap.entries(),
      ).map(([trackId, stat]) => ({
        trackId,
        ...stat,
      }));

      return {
        totalSubmissions,
        submissionsByTrack,
        submissionsByStatus,
        acceptanceRate: Math.round(acceptanceRate * 10) / 10,
        totalAccepted,
        totalRejected,
      };
    } catch (error: any) {
      throw error;
    }
  }

//  Lấy danh sách submission IDs theo trackId
  async getSubmissionIdsByTrack(
    trackId: number,
    authToken: string,
  ): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.submissionServiceUrl}/submissions/track/${trackId}/ids`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );

      const data = response.data?.data || response.data || {};
      return data.submissionIds || [];
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Unknown error';
      if (!status || status >= 500) {
        throw new HttpException(
          {
            message: 'Không thể xác minh track có submissions hay không. Submission-service đang không khả dụng. Vui lòng thử lại sau hoặc liên hệ admin.',
            detail: {
              trackId,
              service: 'submission-service',
              reason: 'Service unavailable or timeout',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE, 
        );
      }

      if (status === HttpStatus.NOT_FOUND) {
        return [];
      }
      throw new HttpException(
        {
          message: `Không thể lấy danh sách submissions của track: ${errorMessage}`,
          detail: {
            trackId,
            status,
            service: 'submission-service',
          },
        },
        status && status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY, 
      );
    }
  }
}

