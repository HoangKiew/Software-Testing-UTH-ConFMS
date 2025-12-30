// src/reviews/reviews.client.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReviewsClient {
  private baseUrl: string;

  constructor(
    private config: ConfigService,
    private http: HttpService,
  ) {
    this.baseUrl = this.config.get<string>('REVIEW_SERVICE_URL') || 'http://localhost:3004/api';
  }

  async getAggregatedScores(submissionId: string): Promise<{
    avgScore: number;
    comments: string[];
    reviewerCount: number;
  }> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/reviews/aggregated/${submissionId}`),
      );
      return data;
    } catch (error) {
      console.error(`Lỗi khi lấy đánh giá cho submission ${submissionId}:`, error.message);
      // Fallback tạm thời nếu review-service chưa sẵn sàng
      return { avgScore: 5.0, comments: ['Chưa có đánh giá chi tiết.'], reviewerCount: 0 };
    }
  }
}