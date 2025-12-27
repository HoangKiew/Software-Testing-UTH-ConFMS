import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ReviewClient {
    private readonly baseUrl = process.env.REVIEW_SERVICE_URL || 'http://localhost:3002';

    async notifyNewSubmission(submissionId: number, title: string, conferenceId: number, authors: any[]) {
        try {
            await axios.post(`${this.baseUrl}/api/submissions/sync`, {
                submissionId,
                title,
                conferenceId,
                authors,
            });
            console.log(`✅ Notified Review Service about submission #${submissionId}`);
        } catch (error) {
            console.error('⚠️ Không thể kết nối tới Review Service:', error.message);
            // Không throw lỗi để tránh block flow chính
        }
    }

    async notifyStatusChange(submissionId: number, newStatus: string, comment?: string) {
        try {
            await axios.patch(`${this.baseUrl}/api/submissions/${submissionId}/status`, {
                status: newStatus,
                comment,
            });
            console.log(`✅ Notified Review Service about status change for submission #${submissionId}`);
        } catch (error) {
            console.error('⚠️ Không thể thông báo thay đổi status tới Review Service:', error.message);
            // Không throw lỗi
        }
    }
}
