import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ConferenceClient {
    private readonly baseUrl = process.env.CONFERENCE_SERVICE_URL || 'http://localhost:3002/api';

    async getTrackDeadline(trackId: number) {
        const response = await axios.get(`${this.baseUrl}/tracks/${trackId}`);
        return new Date(response.data.deadline);
    }

    async checkDeadline(conferenceId: number | string): Promise<boolean> {
        try {
            // ✅ FIX: Convert to string to ensure correct type
            const confIdStr = conferenceId.toString();

            // Call internal endpoint - NO AUTH REQUIRED
            console.log(`[ConferenceClient] Requesting: ${this.baseUrl}/internal/conferences/${confIdStr}/deadline-check`);
            const response = await axios.get(
                `${this.baseUrl}/internal/conferences/${confIdStr}/deadline-check`
            );

            const { canSubmit, message } = response.data;

            if (!canSubmit) {
                throw new BadRequestException(message);
            }

            console.log(`✅ Deadline check passed: ${message}`);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new BadRequestException('Hội nghị không tồn tại');
            }
            if (error instanceof BadRequestException) throw error;

            // ✅ FIX: Only fallback in development mode
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ [DEV MODE] Conference Service not available - allowing submission');
                return true;
            }

            // Production: throw error instead of allowing
            console.error('❌ Conference Service unavailable in production');
            throw new InternalServerErrorException(
                'Không thể kiểm tra deadline lúc này. Vui lòng thử lại sau.'
            );
        }
    }
}