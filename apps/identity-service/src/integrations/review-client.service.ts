import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ReviewerActivityStats {
  assignmentCount: number;
  reviewCount: number;
  hasActiveAssignments: boolean;
  completedReviews: number;
}

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
  // Lấy thống kê hoạt động của reviewer từ review-service
  async getReviewerActivityStats(
    reviewerId: number, 
    authToken?: string
  ): Promise<ReviewerActivityStats> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const fullUrl = `${this.reviewServiceUrl}/reviews/reviewer/${reviewerId}/stats`;
      const response = await firstValueFrom(
        this.httpService.get(fullUrl, {
          headers,
          timeout: 10000,
        }),
      );

      const stats = response.data?.data || response.data || {};
      return {
        assignmentCount: stats.assignmentCount || 0,
        reviewCount: stats.reviewCount || 0,
        hasActiveAssignments: stats.hasActiveAssignments || false,
        completedReviews: stats.completedReviews || 0,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      if (!status || status >= 500) {
        throw new HttpException(
          {
            message: 'Không thể xác minh người dùng có đang chấm bài hay không. Review-service đang không khả dụng. Vui lòng thử lại sau hoặc liên hệ admin.',
            detail: {
              reviewerId,
              service: 'review-service',
              reason: 'Service unavailable or timeout',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      if (status === HttpStatus.NOT_FOUND) {
        return {
          assignmentCount: 0,
          reviewCount: 0,
          hasActiveAssignments: false,
          completedReviews: 0,
        };
      }
      throw new HttpException(
        {
          message: `Không thể kiểm tra hoạt động reviewer của người dùng: ${errorMessage}`,
          detail: {
            reviewerId,
            status,
            service: 'review-service',
          },
        },
        status && status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY, 
      );
    }
  }
}
