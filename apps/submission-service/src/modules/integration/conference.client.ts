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
            const deadline = new Date(conference.submission_deadline);

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