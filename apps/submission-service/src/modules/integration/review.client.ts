import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AnonymousReviewDto } from '../../dtos/review.dto';

@Injectable()
export class ReviewClient {
    private readonly baseUrl = process.env.REVIEW_SERVICE_URL || 'http://localhost:3004';

    async notifyNewSubmission(submissionId: number, title: string, conferenceId: string, authors: any[]) {
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

    /**
     * Lấy reviews của submission (ẩn danh cho author)
     */
    async getReviewsForSubmission(
        submissionId: number,
        isChair: boolean = false
    ): Promise<AnonymousReviewDto[]> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/reviews/submission/${submissionId}`
            );

            const reviews = response.data;

            // Nếu là CHAIR, trả về full data
            if (isChair) {
                return reviews;
            }

            // Nếu là AUTHOR, ẩn danh reviewer identity
            return reviews.map((review: any, index: number) => ({
                id: review.id,
                reviewerName: `Reviewer #${index + 1}`,  // ✅ Ẩn danh
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                status: review.status
            }));
        } catch (error) {
            console.error('⚠️ Không thể lấy reviews từ Review Service:', error.message);
            return [];  // Trả về empty array nếu lỗi
        }
    }
}
