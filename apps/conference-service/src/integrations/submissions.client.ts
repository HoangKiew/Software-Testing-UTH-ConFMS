import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Submission {
  id: string;
  conferenceId?: string;
  title?: string;
  authors?: Array<{ email?: string } | string>;
  status?: string;
  [key: string]: any;
}

@Injectable()
export class SubmissionsClient {
  private baseUrl: string;
  private timeout: number;

  constructor(private config: ConfigService, private http: HttpService) {
    const raw = this.config.get<string>('SUBMISSION_SERVICE_URL') || 'http://localhost:3003';
    const trimmed = raw.replace(/\/+$/g, '');
    // If the configured base already contains /api, keep as-is, otherwise append /api
    this.baseUrl = trimmed.includes('/api') ? trimmed : `${trimmed}/api`;
    this.timeout = this.config.get<number>('SUBMISSION_SERVICE_TIMEOUT') || 5000;
  }

  private axiosOpts() {
    return { timeout: this.timeout };
  }

  async getSubmission(submissionId: string): Promise<Submission> {
    const url = `${this.baseUrl}/submissions/${submissionId}`;
    try {
      const { data } = await firstValueFrom(this.http.get(url, this.axiosOpts()));
      return data;
    } catch (error) {
      console.warn('Submissions service not available, returning stub for getSubmission');
      return {
        id: submissionId,
        conferenceId: undefined,
        title: 'Mock Submission',
        keywords: 'AI,ML',
        authors: [],
        status: 'under_review',
      } as Submission;
    }
  }

  async getSubmissionsByConference(conferenceId: string): Promise<Submission[]> {
    const url = `${this.baseUrl}/submissions/conference/${conferenceId}`;
    try {
      const { data } = await firstValueFrom(this.http.get(url, this.axiosOpts()));
      // submission-service may return { status, data, total } or an array
      if (data && data.data) return data.data;
      return data;
    } catch (error) {
      console.warn('Submissions service not available, returning stub list for getSubmissionsByConference');
      return [
        {
          id: 'sub-1',
          conferenceId,
          title: 'Mock Submission 1',
          status: 'under_review',
        },
      ];
    }
  }

  async updateStatus(submissionId: string, status: string): Promise<any> {
    const url = `${this.baseUrl}/submissions/${submissionId}/status`;
    try {
      const { data } = await firstValueFrom(this.http.patch(url, { status }, this.axiosOpts()));
      return data;
    } catch (error) {
      console.warn(`Failed to update status for submission ${submissionId}:`, error?.message || error);
      throw error;
    }
  }

  async countByConference(conferenceId: string): Promise<number> {
    const subs = await this.getSubmissionsByConference(conferenceId);
    return Array.isArray(subs) ? subs.length : 0;
  }

  async countByConferenceAndStatus(conferenceId: string, status: string): Promise<number> {
    const subs = await this.getSubmissionsByConference(conferenceId);
    if (!Array.isArray(subs)) return 0;
    return subs.filter((s) => (s.status || '').toLowerCase() === (status || '').toLowerCase()).length;
  }
}
