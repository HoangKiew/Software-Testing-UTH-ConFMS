import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './reviews/review.entity';

@Injectable()
export class ReviewServiceService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  // ============================
  // Health check
  // ============================
  getHealthStatus() {
    return {
      dichVu: 'review-service',
      trangThai: 'ok',
      thoiGian: new Date().toISOString(),
    };
  }

  // ============================
  // Reviewer ghi / cập nhật review
  // ============================
  async saveReview(
    reviewId: number,
    data: Partial<Review>,
  ) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy review');

    if (review.submitted) {
      throw new BadRequestException('Review đã được nộp, không thể sửa');
    }

    Object.assign(review, data);
    return this.reviewRepo.save(review);
  }

  // ============================
  // Reviewer nộp review (KHÓA)
  // ============================
  async submitReview(reviewId: number) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy review');

    review.submitted = true;
    return this.reviewRepo.save(review);
  }

  // ============================
  // Xem review của mình
  // ============================
  async getReview(reviewId: number) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy review');
    return review;
  }
}
