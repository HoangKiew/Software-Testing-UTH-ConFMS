import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TrackMember {
  id: number;
  trackId: number;
  userId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  track?: {
    id: number;
    name: string;
    conferenceId: number;
    conference?: {
      id: number;
      name: string;
    };
  };
}

@Injectable()
export class ConferenceClientService {
  private readonly conferenceServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // Check if running in Docker
    const isDocker =
      process.env.DOCKER_ENV === 'true' ||
      process.env.CONFERENCE_SERVICE_URL?.includes('conference-service');

    this.conferenceServiceUrl =
      this.configService.get<string>('CONFERENCE_SERVICE_URL') ||
      (isDocker
        ? 'http://conference-service:3002/api'
        : 'http://localhost:3002/api');
    this.httpService.axiosRef.defaults.baseURL = this.conferenceServiceUrl;
    this.httpService.axiosRef.defaults.timeout = 10000;
  }
  // Fetch track assignments for the authenticated user
  async getMyTrackAssignments(authToken: string): Promise<TrackMember[]> {
    try {
      const url = '/conferences/reviewer/my-track-assignments';
      const fullUrl = `${this.conferenceServiceUrl}${url}`;
      const axios = require('axios');
      const response = await axios.get(fullUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 10000,
      });
      const result = response.data;
      const assignments = result?.data || [];
      return assignments;
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy track assignments';
      if (!status || status >= 500) {
        return [];
      }

      if (
        status === HttpStatus.UNAUTHORIZED ||
        status === HttpStatus.FORBIDDEN
      ) {
        throw new HttpException(message, status);
      }

      throw new HttpException(
        `Conference-service error: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
