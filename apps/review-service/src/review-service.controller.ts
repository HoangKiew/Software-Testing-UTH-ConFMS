import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReviewServiceService } from './review-service.service';
import { CreateReviewDto } from './review/dto/create-review.dto';

@Controller('reviews')
export class ReviewServiceController {
  constructor(private readonly service: ReviewServiceService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'review-service' };
  }

  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.service.createReview(dto);
  }

  @Get('submission/:id')
  getBySubmission(@Param('id') id: string) {
    return this.service.getBySubmission(id);
  }

  @Get('reviewer/:id')
  getByReviewer(@Param('id') id: string) {
    return this.service.getByReviewer(id);
  }
}
