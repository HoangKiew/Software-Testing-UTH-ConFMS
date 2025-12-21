import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { ReviewServiceService } from './review-service.service';

@Controller()
export class ReviewServiceController {
  constructor(private readonly reviewService: ReviewServiceService) {}

  // ============================
  // Health check
  // ============================
  @Get('health')
  healthCheck() {
    return this.reviewService.getHealthStatus();
  }

  // ============================
  // Xem review theo ID
  // ============================
  @Get('reviews/:id')
  getReview(@Param('id') id: number) {
    return this.reviewService.getReview(+id);
  }

  // ============================
  // Cập nhật review
  // ============================
  @Patch('reviews/:id')
  saveReview(@Param('id') id: number, @Body() body: any) {
    return this.reviewService.saveReview(+id, body);
  }

  // ============================
  // Nộp review (KHÓA)
  // ============================
  @Post('reviews/:id/submit')
  submitReview(@Param('id') id: number) {
    return this.reviewService.submitReview(+id);
  }
}
