// HTTP Client to communicate with Submission Service
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SubmissionsClient {
    private readonly baseUrl = process.env.SUBMISSION_SERVICE_URL || 'http://localhost:3003/api';

    constructor(private readonly httpService: HttpService) { }

    async getSubmissionsByConference(conferenceId: string): Promise<any[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/submissions/conference/${conferenceId}`)
            );
            return response.data?.data || [];
        } catch (error) {
            console.error('Failed to fetch submissions from Submission Service:', error.message);
            return [];
        }
    }

    async getSubmissionById(submissionId: number): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/submissions/${submissionId}`)
            );
            return response.data?.data || null;
        } catch (error) {
            console.error('Failed to fetch submission from Submission Service:', error.message);
            return null;
        }
    }

    async updateSubmissionStatus(submissionId: number, status: string, comment?: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.patch(`${this.baseUrl}/submissions/${submissionId}/status`, {
                    status,
                    comment
                })
            );
            return response.data?.data || null;
        } catch (error) {
            console.error('Failed to update submission status:', error.message);
            throw error;
        }
    }
}
