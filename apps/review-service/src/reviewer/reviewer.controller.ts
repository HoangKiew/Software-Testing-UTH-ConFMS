import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { ReviewerService } from './reviewer.service';
import { Assignment } from '../entities/assignment.entity';
import { Review } from '../entities/review.entity';
import { DiscussionMessage } from '../entities/discussion-message.entity';

@Controller('reviewer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('reviewer')
export class ReviewerController {
  constructor(private readonly reviewerService: ReviewerService) {}

  // 1. Lấy danh sách bài được phân công
  @Get('assignments')
  async getAssignments(@CurrentUser('sub') reviewerId: string): Promise<any[]> {
    return this.reviewerService.getAssignedAssignments(reviewerId);
  }

  // 2. Chấp nhận nhiệm vụ
  @Post('assignments/:id/accept')
  async accept(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') reviewerId: string,
  ): Promise<Assignment> {
    return this.reviewerService.acceptAssignment(id, reviewerId);
  }

  // 3. Từ chối nhiệm vụ
  @Post('assignments/:id/reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') reviewerId: string,
  ): Promise<Assignment> {
    return this.reviewerService.rejectAssignment(id, reviewerId);
  }

  // 4. Lấy link tải file bài báo
  @Get('assignments/:id/paper')
  async getPaperFile(
    @Param('id', ParseIntPipe) assignmentId: number,
    @CurrentUser('sub') reviewerId: string,
  ): Promise<{ fileUrl: string }> {
    return this.reviewerService.getPaperFileUrlForReviewer(assignmentId, reviewerId);
  }

  // 5. Nộp đánh giá lần đầu
  @Post('assignments/:id/review')
  async submitReview(
    @Param('id', ParseIntPipe) assignmentId: number,
    @CurrentUser('sub') reviewerId: string,
    @Body() body: any,
  ): Promise<Review> {
    return this.reviewerService.submitReview(assignmentId, reviewerId, body);
  }

  // 6. Xem đánh giá của mình
  @Get('assignments/:id/review')
  async getMyReview(
    @Param('id', ParseIntPipe) assignmentId: number,
    @CurrentUser('sub') reviewerId: string,
  ): Promise<Review> {
    return this.reviewerService.getMyReview(assignmentId, reviewerId);
  }

  // 7. Chỉnh sửa đánh giá
  @Patch('assignments/:id/review')
  async updateReview(
    @Param('id', ParseIntPipe) assignmentId: number,
    @CurrentUser('sub') reviewerId: string,
    @Body() body: any,
  ): Promise<Review> {
    return this.reviewerService.updateReview(assignmentId, reviewerId, body);
  }

  // 8. Gửi tin nhắn thảo luận nội bộ
  @Post('discussion/:submissionId')
  async sendMessage(
    @Param('submissionId') submissionId: string,
    @CurrentUser('sub') senderId: string,
    @Body('content') content: string,
  ): Promise<DiscussionMessage> {
    if (!content || content.trim() === '') {
      throw new ForbiddenException('Nội dung tin nhắn không được để trống');
    }
    return this.reviewerService.sendDiscussionMessage(submissionId, senderId, content.trim());
  }

  // 9. Xem thảo luận nội bộ
  @Get('discussion/:submissionId')
  async getDiscussion(
    @Param('submissionId') submissionId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<DiscussionMessage[]> {
    return this.reviewerService.getDiscussion(submissionId, userId);
  }
}