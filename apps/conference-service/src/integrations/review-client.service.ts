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
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.REVIEW_SERVICE_URL?.includes('review-service');
    
    this.reviewServiceUrl =
      this.configService.get<string>('REVIEW_SERVICE_URL') ||
      (isDocker 
        ? 'http://review-service:3004/api' 
        : 'http://localhost:3004/api');
  }
  // Kiểm tra user đã review submissions trong track chưa
  async hasUserReviewedSubmissions(
    reviewerId: number,
    submissionIds: string[],
    authToken: string,
  ): Promise<boolean> {
    try {
      if (!submissionIds || submissionIds.length === 0) {
        return false;
      }
      const response = await firstValueFrom(
        this.httpService.get(`${this.reviewServiceUrl}/reviews/reviewer/${reviewerId}/stats`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );
      const stats = response.data?.data || response.data || {};
      return (stats.assignmentCount || 0) > 0 || (stats.reviewCount || 0) > 0;
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      if (!status || status >= 500) {
        throw new HttpException(
          {
            message: 'Không thể xác minh người dùng có đã review submissions trong track này hay không. ',
            detail: {
              reviewerId,
              submissionIdsCount: submissionIds?.length || 0,
              service: 'review-service',
              reason: 'Service unavailable or timeout',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE, 
        );
      }
      if (status === HttpStatus.NOT_FOUND) {
        return false;
      }
      throw new HttpException(
        {
          message: `Không thể kiểm tra reviews của người dùng trong track này: ${errorMessage}`,
          detail: {
            reviewerId,
            submissionIdsCount: submissionIds?.length || 0,
            status,
            service: 'review-service',
          },
        },
        status && status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY, 
      );
    }
  }
}
