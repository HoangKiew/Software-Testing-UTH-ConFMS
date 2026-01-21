import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
// Đếm số bài nộp của author từ submission-service
  async countSubmissionsByAuthorId(authorId: number, authToken?: string): Promise<number> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const fullUrl = `${this.submissionServiceUrl}/submissions/author/${authorId}/count`;
      const response = await firstValueFrom(
        this.httpService.get(fullUrl, {
          headers,
          timeout: 10000,
        }),
      );

      const count = response.data?.data?.count || response.data?.count || 0;
      return typeof count === 'number' ? count : 0;
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      if (!status || status >= 500) {
        throw new HttpException(
          {
            message: 'Không thể xác minh người dùng có bài nộp hay không. Submission-service đang không khả dụng. Vui lòng thử lại sau hoặc liên hệ admin.',
            detail: {
              authorId,
              service: 'submission-service',
              reason: 'Service unavailable or timeout',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      if (status === HttpStatus.NOT_FOUND) {
        return 0;
      }
      throw new HttpException(
        {
          message: `Không thể kiểm tra submissions của người dùng: ${errorMessage}`,
          detail: {
            authorId,
            status,
            service: 'submission-service',
          },
        },
        status && status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY, 
      );
    }
  }
}
