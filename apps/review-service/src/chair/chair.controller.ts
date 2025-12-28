import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChairService } from './chair.service';
import { FinalDecision } from '../entities/decision.entity';

@Controller('chair')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('chair')
export class ChairController {
  constructor(private readonly chairService: ChairService) {}

  // 1. Xem tổng hợp đánh giá của một bài
  @Get('submissions/:submissionId/reviews')
  async getReviewsSummary(
    @Param('submissionId') submissionId: string,
    @CurrentUser('sub') chairId: string,
  ) {
    return this.chairService.getSubmissionReviewsSummary(submissionId, chairId);
  }

  // 2. Ra quyết định cuối cùng
  @Post('submissions/:submissionId/decision')
  async makeDecision(
    @Param('submissionId') submissionId: string,
    @CurrentUser('sub') chairId: string,
    @Body('decision') decision: FinalDecision,
    @Body('chairComment') chairComment?: string,
  ) {
    return this.chairService.makeDecision(submissionId, chairId, decision, chairComment);
  }

  // 3. Gửi thông báo hàng loạt (bulk)
  @Post('notifications/bulk')
  async sendBulkNotification(@Body('submissionIds') submissionIds: string[]) {
    if (!submissionIds || submissionIds.length === 0) {
      throw new BadRequestException('Danh sách submissionIds không được trống');
    }
    return this.chairService.sendBulkNotification(submissionIds);
  }

  // 4. Tham gia thảo luận nội bộ (dùng chung route với reviewer, nhưng cho phép chair)
  @Post('discussion/:submissionId')
  async sendMessage(
    @Param('submissionId') submissionId: string,
    @CurrentUser('sub') senderId: string,
    @Body('content') content: string,
  ) {
    return this.chairService.sendDiscussionMessage(submissionId, senderId, content);
  }

  @Get('discussion/:submissionId')
  async getDiscussion(@Param('submissionId') submissionId: string) {
    return this.chairService.getDiscussion(submissionId);
  }
}