// src/reviews/reviews.client.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  Scope,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom, catchError, timer } from 'rxjs';
import { retryWhen, mergeMap, map } from 'rxjs/operators';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';  // ← Sửa: import type để fix TS1272

export interface AggregatedReview {
  avgScore: number;
  comments: string[];
  reviewerCount: number;
  scores?: number[];
  [key: string]: unknown;
}

export interface CountResponse {
  count: number;
}

export interface AverageScoreResponse {
  avgScore: number;
}

@Injectable({ scope: Scope.REQUEST })
export class ReviewsClient {
  private readonly logger = new Logger(ReviewsClient.name);
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    @Inject(REQUEST) private readonly request: Request, // ← Forward token từ user
  ) {
    const rawUrl = this.config.get<string>('REVIEW_SERVICE_URL') ?? 'http://review-service:3004';
    const trimmed = rawUrl.replace(/\/+$/, '');
    this.baseUrl = trimmed.includes('/api') ? trimmed : `${trimmed}/api`;
    this.timeout = this.config.get<number>('REVIEW_SERVICE_TIMEOUT') ?? 8000;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const authHeader = this.request?.headers?.authorization;
    if (authHeader) {
      headers.Authorization = authHeader; // ← Forward Bearer token
    }
    return headers;
  }

  private getDefaultConfig(): AxiosRequestConfig {
    return {
      timeout: this.timeout,
      headers: this.getHeaders(),
    };
  }

  private shouldRetry(error: any): boolean {
    if (!error.response) return true; // network/timeout
    const status = error.response?.status;
    return status >= 500 || status === 429 || status === 503;
  }

  // Đổi tên method để tránh trùng với property 'request'
  private async internalRequest<T>(
    method: 'GET',
    endpoint: string,
    configOverride?: Partial<AxiosRequestConfig>,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const config = { ...this.getDefaultConfig(), ...configOverride };

    try {
      const response = await firstValueFrom(
        this.http.get<T>(url, config).pipe(
          retryWhen(errors =>
            errors.pipe(
              mergeMap((error, attempt) => {
                if (attempt >= 3 || !this.shouldRetry(error)) {
                  throw error;
                }
                const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000);
                this.logger.warn(
                  `Retrying GET ${endpoint} (attempt ${attempt + 1}/3) after ${delayMs}ms`,
                );
                return timer(delayMs);
              }),
            ),
          ),
          map(res => res.data as T),
          catchError(err => {
            this.logger.warn(`Request failed: GET ${endpoint}`, {
              message: err.message,
              status: err.response?.status,
              data: err.response?.data?.message || err.response?.data,
            });
            throw err;
          }),
        ),
      );

      return response;
    } catch (error: any) {
      this.logger.error(`Critical failure on GET ${endpoint}`, error);
      throw new InternalServerErrorException(`Review service unavailable: ${error.message}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Public Methods
  // ──────────────────────────────────────────────────────────────────────────────

  async getAggregatedScores(submissionId: string): Promise<AggregatedReview> {
    const fallback: AggregatedReview = {
      avgScore: 0,
      comments: ['Chưa có đánh giá hoặc review-service tạm thời không khả dụng'],
      reviewerCount: 0,
    };

    try {
      return await this.internalRequest<AggregatedReview>('GET', `/reviews/aggregated/${submissionId}`);
    } catch (err) {
      this.logger.warn(`getAggregatedScores failed for ${submissionId}`, err);
      return fallback;
    }
  }

  async countReviewsByConference(conferenceId: string): Promise<number> {
    try {
      const data = await this.internalRequest<CountResponse>('GET', `/reviews/conference/${conferenceId}/count`);
      return Number(data.count) || 0;
    } catch (err) {
      this.logger.warn(`countReviewsByConference failed for ${conferenceId}`, err);
      return 0;
    }
  }

  async countOnTimeReviewsByConference(conferenceId: string): Promise<number> {
    try {
      const data = await this.internalRequest<CountResponse>('GET', `/reviews/conference/${conferenceId}/on-time-count`);
      return Number(data.count) || 0;
    } catch (err) {
      this.logger.warn(`countOnTimeReviewsByConference failed for ${conferenceId}`, err);
      return 0;
    }
  }

  async getAverageScoreByConference(conferenceId: string): Promise<number> {
    try {
      const data = await this.internalRequest<AverageScoreResponse>('GET', `/reviews/conference/${conferenceId}/average-score`);
      return Number(data.avgScore) || 0;
    } catch (err) {
      this.logger.warn(`getAverageScoreByConference failed for ${conferenceId}`, err);
      return 0;
    }
  }
}