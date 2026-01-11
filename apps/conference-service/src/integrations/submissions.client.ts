// apps/conference-service/src/integrations/submissions.client.ts
import { Injectable, Logger, InternalServerErrorException, ForbiddenException, Inject, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom, catchError, timer } from 'rxjs';
import { retryWhen, mergeMap, map } from 'rxjs/operators';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

export interface Author {
  name?: string;
  email?: string;
  affiliation?: string;
}

export interface Submission {
  id: number | string;
  conference_id: string;
  title: string;
  abstract?: string;
  topic?: string;
  topics?: string[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'REVISION_REQUIRED' | string;
  created_by: number;
  created_at: string;
  updated_at: string;
  authors?: Author[];
  files?: any[];
  [key: string]: unknown;
}

export interface PaginatedSubmissionResponse {
  data: Submission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

@Injectable({ scope: Scope.REQUEST })
export class SubmissionsClient {
  private readonly logger = new Logger(SubmissionsClient.name);
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly internalToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    @Inject(REQUEST) private readonly request: Request | null,
  ) {
    const rawUrl = this.config.get<string>('SUBMISSION_SERVICE_URL') ?? 'http://submission-service:3003';
    const trimmed = rawUrl.replace(/\/+$/, '');
    this.baseUrl = trimmed.includes('/api') ? trimmed : `${trimmed}/api`;
    this.timeout = this.config.get<number>('SUBMISSION_SERVICE_TIMEOUT') ?? 10000;

    this.internalToken = this.config.get<string>('INTERNAL_SUBMISSION_TOKEN') || '';
    if (!this.internalToken) {
      this.logger.warn('INTERNAL_SUBMISSION_TOKEN chưa được thiết lập → fallback dùng token từ request');
    }
  }

  private getHeaders(useInternalToken = false): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (useInternalToken && this.internalToken) {
      headers.Authorization = `Bearer ${this.internalToken}`;
      this.logger.debug('Sử dụng INTERNAL_SUBMISSION_TOKEN');
    } else if (this.request?.headers?.authorization) {
      headers.Authorization = this.request.headers.authorization;
      this.logger.debug('Sử dụng token từ request user');
    } else {
      this.logger.warn('Không có token nào → request có thể bị 401/403');
    }

    return headers;
  }

  private getDefaultConfig(useInternalToken = false): AxiosRequestConfig {
    return { timeout: this.timeout, headers: this.getHeaders(useInternalToken) };
  }

  private shouldRetry(error: any): boolean {
    if (!error.response) return true;
    const status = error.response?.status;
    return status >= 500 || status === 429 || status === 503;
  }

  private async internalRequest<T>(
    method: 'GET' | 'PATCH' | 'POST',
    endpoint: string,
    body?: any,
    configOverride?: Partial<AxiosRequestConfig>,
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const config = { ...this.getDefaultConfig(true), ...configOverride };

    const request$ = method === 'GET'
      ? this.http.get(url, config)
      : method === 'PATCH'
        ? this.http.patch(url, body ?? {}, config)
        : this.http.post(url, body ?? {}, config);

    try {
      const response = await firstValueFrom(
        request$.pipe(
          retryWhen(errors =>
            errors.pipe(
              mergeMap((error, attempt) => {
                if (attempt >= 3 || !this.shouldRetry(error)) throw error;
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                this.logger.warn(`Retrying ${method} ${endpoint} (attempt ${attempt + 1})`);
                return timer(delay);
              }),
            ),
          ),
          map(res => res.data),
          catchError(err => {
            this.logger.warn(`${method} ${endpoint} failed`, {
              message: err.message,
              status: err.response?.status,
              data: err.response?.data,
            });
            throw err;
          }),
        ),
      );

      return this.extractData(response);
    } catch (e: any) {
      const status = e.response?.status;
      const message = e.response?.data?.message || e.message;

      if (status === 403) {
        throw new ForbiddenException(`Submission service forbidden: ${message}`);
      }
      if (status >= 500) {
        throw new InternalServerErrorException(`Submission service internal error: ${message}`);
      }
      throw new InternalServerErrorException(`Submission service unavailable: ${message}`);
    }
  }

  /**
   * Helper: Chuẩn hóa response từ Submission Service
   * - Nếu có { status, data } → trả về data
   * - Nếu có { data, pagination } → trả về nguyên object
   * - Nếu là object/array trực tiếp → trả về luôn
   */
  private extractData(response: any): any {
    if (response && typeof response === 'object') {
      if ('status' in response && response.status === 'success' && 'data' in response) {
        return response.data;
      }
      if ('data' in response && 'pagination' in response) {
        return response; // giữ nguyên cho paginated
      }
      // THÊM: Case response có total trực tiếp (không pagination object)
      if ('data' in response && typeof response.total === 'number') {
        return {
          data: response.data,
          pagination: { total: response.total }
        };
      }
    }
    return response;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Public Methods
  // ──────────────────────────────────────────────────────────────────────────────

  async getSubmission(submissionId: string): Promise<Submission> {
    const data = await this.internalRequest<any>('GET', `/submissions/${submissionId}`);
    if (!data?.conference_id) {
      this.logger.warn(`Submission ${submissionId} missing conference_id`, data);
    }
    return data as Submission;
  }

  async getSubmissionsPaginated(
    conferenceId: string,
    page = 1,
    limit = 100,
    status?: string,
  ): Promise<PaginatedSubmissionResponse> {
    const query = new URLSearchParams();
    query.append('page', page.toString());
    query.append('limit', limit.toString());
    if (status) query.append('status', status.toUpperCase());

    const raw = await this.internalRequest<any>(
      'GET',
      `/submissions/conference/${conferenceId}?${query.toString()}`,
    );

    // THÊM: Chuẩn hóa response để luôn có pagination.total
    const data = raw.data ?? raw;
    const pagination = raw.pagination ?? { total: raw.total ?? (Array.isArray(data) ? data.length : 0) };

    return {
      data: data ?? [],
      pagination: {
        page: Number(query.get('page')) || 1,
        limit: Number(query.get('limit')) || 100,
        total: pagination.total,
        totalPages: pagination.totalPages
      }
    };
  }

  async *getAcceptedSubmissionsGenerator(
    conferenceId: string,
    pageSize = 500,
  ): AsyncGenerator<Submission[], void, unknown> {
    let page = 1;
    while (true) {
      const res = await this.getSubmissionsPaginated(conferenceId, page, pageSize, 'ACCEPTED');

      if (!res.data?.length) break;

      yield res.data;
      if (res.data.length < pageSize) break;
      page++;
    }
  }

  async updateSubmissionStatus(
    submissionId: string,
    status: string,
  ): Promise<{ success: boolean; submission?: Submission }> {
    return this.internalRequest('PATCH', `/submissions/${submissionId}/status`, { status });
  }

  async countSubmissions(conferenceId: string): Promise<number> {
    try {
      const res = await this.getSubmissionsPaginated(conferenceId, 1, 1);
      return res.pagination?.total ?? 0;
    } catch (e) {
      this.logger.warn('countSubmissions failed', e);
      return 0;
    }
  }

  async countSubmissionsByStatus(conferenceId: string, status: string): Promise<number> {
    try {
      const res = await this.getSubmissionsPaginated(conferenceId, 1, 1, status);
      return res.pagination?.total ?? 0;
    } catch (e) {
      this.logger.warn(`countSubmissionsByStatus(${status}) failed`, e);
      return 0;
    }
  }

  /**
   * @deprecated Sẽ bị loại bỏ sau khi backend hỗ trợ filter topic
   */
  async countSubmissionsByTopic(conferenceId: string, topic: string): Promise<number> {
    let count = 0;
    for await (const batch of this.getAcceptedSubmissionsGenerator(conferenceId, 800)) {
      count += batch.filter(s => s.topic === topic).length;
    }
    return count;
  }
}