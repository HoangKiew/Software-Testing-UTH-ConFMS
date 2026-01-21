import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReviewClientService {
  private readonly reviewServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.reviewServiceUrl =
      this.configService.get<string>('REVIEW_SERVICE_URL') ||
      'http://localhost:3004/api';

    this.httpService.axiosRef.defaults.baseURL = this.reviewServiceUrl;
    this.httpService.axiosRef.defaults.timeout = 10000;
  }
  async getAnonymizedReviewsForAuthor(
    submissionId: string,
  ): Promise<Array<{ score: number; commentForAuthor: string; recommendation: string }>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/reviews/submission/${submissionId}/anonymized`),
      );
      return response.data.data || [];
    } catch (error: any) {
      const status = error.response?.status;
      if (status === HttpStatus.NOT_FOUND) {
        return [];
      }
      return [];
    }
  }
  // Lấy danh sách assignments của reviewer
  async getReviewerAssignments(
    authToken?: string,
  ): Promise<Array<{ submissionId: string; id: number }>> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const response = await firstValueFrom(
        this.httpService.get(`/reviews/assignments/me`, { headers }),
      );
      const assignments = response.data.data || [];
      return assignments.map((a: any) => ({
        submissionId: a.submissionId,
        id: a.id,
      }));
    } catch (error: any) {
      return [];
    }
  }
}
