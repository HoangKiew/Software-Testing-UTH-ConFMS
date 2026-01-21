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
}

@Injectable()
export class SubmissionClientService {
  private readonly submissionServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const isDocker =
      process.env.DOCKER_ENV === 'true' ||
      process.env.SUBMISSION_SERVICE_URL?.includes('submission-service');

    this.submissionServiceUrl =
      this.configService.get<string>('SUBMISSION_SERVICE_URL') ||
      (isDocker
        ? 'http://submission-service:3003/api'
        : 'http://localhost:3003/api');
  }

  /**
   * Get submissions by trackId
   */
  async getSubmissionsByTrack(
    trackId: number,
    authToken: string,
    status?: string[],
  ): Promise<Submission[]> {
    try {
      const params: Record<string, any> = {
        trackId,
        limit: 100,
        page: 1,
      };

      const fullUrl = `${this.submissionServiceUrl}/submissions`;
      const response = await firstValueFrom(
        this.httpService.get(fullUrl, {
          params,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );

      const result = response.data;
      let submissions: Submission[] = result?.data || [];
      if (status && status.length > 0) {
        const beforeFilter = submissions.length;
        submissions = submissions.filter((s) => status.includes(s.status));
      }
      return submissions;
    } catch (error: any) {
      const hasResponse =
        error?.response !== undefined && error?.response !== null;
      const status: number | undefined = hasResponse
        ? (error.response.status as number | undefined)
        : undefined;
      const statusText: string | undefined = hasResponse
        ? (error.response.statusText as string | undefined)
        : undefined;
      const responseData: any = hasResponse ? error.response.data : undefined;
      const errorMessage: string = error?.message || 'Unknown error';
      const errorName: string = error?.name || 'Error';
      const errorCode: string | undefined = error?.code;
      const message: string =
        (responseData?.message as string) ||
        (responseData?.error as string) ||
        errorMessage ||
        'Lỗi khi lấy submissions';

      if (typeof status === 'number' && status > 0) {
        if (
          status === HttpStatus.UNAUTHORIZED ||
          status === HttpStatus.FORBIDDEN
        ) {
          throw new HttpException(message, status);
        }
        throw new HttpException(
          `Submission-service error: ${message}`,
          status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY,
        );
      }
      if (
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ETIMEDOUT' ||
        errorName === 'TimeoutError' ||
        errorCode === 'ENOTFOUND'
      ) {
        const connectionErrorMsg =
          errorCode === 'ECONNREFUSED'
            ? `Submission-service không chạy hoặc không thể kết nối. URL: ${this.submissionServiceUrl}`
            : errorCode === 'ETIMEDOUT'
              ? `Kết nối đến submission-service quá thời gian. URL: ${this.submissionServiceUrl}`
              : errorCode === 'ENOTFOUND'
                ? `Không tìm thấy submission-service. URL: ${this.submissionServiceUrl}`
                : `Không thể kết nối đến submission-service. URL: ${this.submissionServiceUrl}`;
        throw new HttpException(
          `${connectionErrorMsg}. Vui lòng kiểm tra submission-service có đang chạy không.`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      throw new HttpException(
        `Submission-service error: ${message || 'Unknown error'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(
    submissionId: string,
    authToken: string,
  ): Promise<Submission | null> {
    try {
      const fullUrl = `${this.submissionServiceUrl}/submissions/${submissionId}`;
      const response = await firstValueFrom(
        this.httpService.get(fullUrl, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );

      const result = response.data;
      return result?.data || null;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === HttpStatus.NOT_FOUND) {
        return null;
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy submission';
      throw new HttpException(
        `Submission-service error: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
  // Update submission status
  async updateSubmissionStatus(
    submissionId: string,
    status: string,
    authToken: string,
  ): Promise<Submission> {
    try {
      const fullUrl = `${this.submissionServiceUrl}/submissions/${submissionId}/status`;
      const response = await firstValueFrom(
        this.httpService.patch(
          fullUrl,
          { status },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            timeout: 10000,
          },
        ),
      );

      return response.data?.data;
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi cập nhật status submission';

      throw new HttpException(
        `Submission-service error: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
