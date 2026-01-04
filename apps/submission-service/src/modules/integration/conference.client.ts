import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ConferenceClient {
    private readonly baseUrl = process.env.CONFERENCE_SERVICE_URL || 'http://localhost:3002/api';

    async getTrackDeadline(trackId: number) {
        const response = await axios.get(`${this.baseUrl}/tracks/${trackId}`);
        return new Date(response.data.deadline);
    }

    async checkDeadline(conferenceId: number): Promise<boolean> {
        try {
                const response = await axios.get(`${this.baseUrl}/conferences/${conferenceId}`);
                const conference = response.data;

                const now = new Date();

                // Require conference to be published/open for submissions
                if (conference.status !== 'open') {
                    throw new BadRequestException('Hội nghị hiện không mở nhận bài');
                }

                // Prefer structured deadlines object, fallback to legacy fields for compatibility
                let deadline: Date | null = null;
                if (conference.deadlines && conference.deadlines.submission) {
                    deadline = new Date(conference.deadlines.submission);
                } else if (conference.submission_deadline) {
                    deadline = new Date(conference.submission_deadline);
                } else if (conference.submissionDeadline) {
                    deadline = new Date(conference.submissionDeadline);
                }

                if (!deadline) {
                    // If no submission deadline provided, allow submission by default
                    console.warn('⚠️  Conference record has no submission deadline — allowing submission by default');
                    return true;
                }

                if (now > deadline) {
                    throw new BadRequestException(`Đã quá hạn nộp bài cho hội nghị này (Deadline: ${deadline.toLocaleString()})`);
                }

                return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new BadRequestException('Hội nghị không tồn tại');
            }
            if (error instanceof BadRequestException) throw error;

            // If Conference Service is not available, allow submission (development mode)
            console.warn('⚠️  Conference Service not available - skipping deadline check');
            return true;
        }
    }
}