import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ReviewerService } from './reviewer.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PostDiscussionDto } from './dto/post-discussion.dto';

@ApiTags('Reviewer')
@ApiBearerAuth('JWT-auth')
@Controller('reviewer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('REVIEWER')
export class ReviewerController {
  constructor(private readonly svc: ReviewerService) {}

  @Get('assignments')
  @ApiOperation({ summary: 'Lấy danh sách phân công của reviewer hiện tại' })
  async listAssignments(@CurrentUser('sub') userId: number) {
    return this.svc.listAssignments(userId);
  }

  @Post('assignments/:id/accept')
  @ApiOperation({ summary: 'Chấp nhận phân công đánh giá' })
  async accept(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    return this.svc.acceptAssignment(Number(id), userId);
  }

  @Post('assignments/:id/reject')
  @ApiOperation({ summary: 'Từ chối phân công đánh giá' })
  async reject(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    return this.svc.rejectAssignment(Number(id), userId);
  }

  @Get('assignments/:id/paper')
  @ApiOperation({ summary: 'Lấy file bài nộp của phân công (nếu có quyền)' })
  async getPaper(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    return this.svc.getPaper(Number(id), userId);
  }

  @Get('assignments/:id/review')
  @ApiOperation({ summary: 'Lấy review hiện tại cùng lịch sử chỉnh sửa' })
  async getReview(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    return this.svc.getReviewByAssignment(Number(id), userId);
  }

  @Post('assignments/:id/review')
  @ApiOperation({ summary: 'Tạo review mới cho phân công (nếu chưa có)' })
  async createReview(
    @Param('id') assignmentId: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser('sub') userId: number
  ) {
    return this.svc.createReview(Number(assignmentId), dto, userId);
  }

  @Patch('assignments/:id/review')
  @ApiOperation({ summary: 'Cập nhật review hiện có (lưu lịch sử trước khi sửa)' })
  async updateReview(
    @Param('id') assignmentId: number,
    @Body() dto: UpdateReviewDto,
    @CurrentUser('sub') userId: number
  ) {
    return this.svc.updateReview(Number(assignmentId), dto, userId);
  }

  @Post('assignments/:id/submit-final')
  @ApiOperation({ summary: 'Nộp final review (chỉ khi có score và publicComment)' })
  async submitFinal(@Param('id') assignmentId: number, @CurrentUser('sub') userId: number) {
    return this.svc.submitFinal(Number(assignmentId), userId);
  }

  @Post('assignments/:id/withdraw-final')
  @ApiOperation({ summary: 'Thu hồi final-review đã nộp để cho phép chỉnh sửa lại' })
  async withdrawFinal(@Param('id') assignmentId: number, @CurrentUser('sub') userId: number) {
    return this.svc.withdrawFinal(Number(assignmentId), userId);
  }

  @Get('discussion/:submissionId')
  @ApiOperation({ summary: 'Lấy danh sách discussion cho submission (reviewer có quyền)' })
  async listDiscussion(@Param('submissionId') submissionId: string, @CurrentUser('sub') userId: number) {
    return this.svc.listDiscussion(submissionId, userId);
  }

  @Post('discussion/:submissionId')
  @ApiOperation({ summary: 'Gửi tin nhắn thảo luận cho submission' })
  async postDiscussion(
    @Param('submissionId') submissionId: string,
    @Body() dto: PostDiscussionDto,
    @CurrentUser('sub') userId: number
  ) {
    return this.svc.postDiscussion(submissionId, dto.content, userId);
  }
}
