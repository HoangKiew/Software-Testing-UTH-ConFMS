import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review/review.entity';
import { CreateReviewDto } from './review/dto/create-review.dto';

@Injectable()
export class ReviewServiceService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
  ) {}

  createReview(dto: CreateReviewDto) {
    const review = this.reviewRepo.create(dto);
    return this.reviewRepo.save(review);
  }

  getBySubmission(submissionId: string) {
    return this.reviewRepo.find({ where: { submissionId } });
  }

  getByReviewer(reviewerId: string) {
    return this.reviewRepo.find({ where: { reviewerId } });
  }
}
