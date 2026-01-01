import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  async listAssignments(@CurrentUser('sub') userId: number) {
    return this.svc.listAssignments(userId);
  }

  @Post('assignments/:id/accept')
  async accept(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    return this.svc.acceptAssignment(Number(id), userId);
  }

  @Post('assignments/:id/reject')
  async reject(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    return this.svc.rejectAssignment(Number(id), userId);
  }

  @Get('assignments/:id/paper')
  async getPaper(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    return this.svc.getPaper(Number(id), userId);
  }

  @Get('assignments/:id/review')
  async getReview(@Param('id') id: number, @CurrentUser('sub') userId: number) {
    return this.svc.getReviewByAssignment(Number(id), userId);
  }

  @Post('assignments/:id/review')
  async createReview(
    @Param('id') assignmentId: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser('sub') userId: number
  ) {
    return this.svc.createReview(Number(assignmentId), dto, userId);
  }

  @Patch('assignments/:id/review')
  async updateReview(
    @Param('id') assignmentId: number,
    @Body() dto: UpdateReviewDto,
    @CurrentUser('sub') userId: number
  ) {
    return this.svc.updateReview(Number(assignmentId), dto, userId);
  }

  @Post('assignments/:id/submit-final')
  async submitFinal(@Param('id') assignmentId: number, @CurrentUser('sub') userId: number) {
    return this.svc.submitFinal(Number(assignmentId), userId);
  }

  @Get('discussion/:submissionId')
  async listDiscussion(@Param('submissionId') submissionId: string, @CurrentUser('sub') userId: number) {
    return this.svc.listDiscussion(submissionId, userId);
  }

  @Post('discussion/:submissionId')
  async postDiscussion(
    @Param('submissionId') submissionId: string,
    @Body() dto: PostDiscussionDto,
    @CurrentUser('sub') userId: number
  ) {
    return this.svc.postDiscussion(submissionId, dto.content, userId);
  }
}
