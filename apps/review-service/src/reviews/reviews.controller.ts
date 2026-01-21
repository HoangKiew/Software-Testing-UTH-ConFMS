import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  ForbiddenException,
  BadRequestException,
  UseGuards,
  Req,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { AssignmentStatus } from './entities/assignment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { SelfAssignDto } from './dto/self-assign.dto';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  private ensureCanManageConference(user?: JwtPayload) {
    const roles = user?.roles || [];
    if (!roles.includes('ADMIN') && !roles.includes('CHAIR')) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
  }

  private canManageConference(user?: JwtPayload): boolean {
    const roles = user?.roles || [];
    return roles.includes('ADMIN') || roles.includes('CHAIR');
  }

  private ensureIsReviewer(user?: JwtPayload) {
    const roles = user?.roles || [];
    if (
      !roles.includes('ADMIN') &&
      !roles.includes('CHAIR') &&
      !roles.includes('REVIEWER')
    ) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
  }

  @Post('bids')
  @ApiOperation({
    summary: 'Reviewer submit preference (bidding) cho bài báo',
    description: 'Reviewer đánh giá mức độ quan tâm của mình đối với một bài báo để Chair có thể xem xét khi phân công.'
  })
  @ApiBody({ type: CreateBidDto })
  @ApiResponse({ status: 201, description: 'Submit bidding thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền REVIEWER' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ' })
  async submitBid(
    @Req() req: Request,
    @Body() dto: CreateBidDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const bid = await this.reviewsService.submitBid(user.sub, dto);

    return {
      message: 'Đánh giá quan tâm bài báo thành công',
      data: bid,
    };
  }

  @Get('assignments/me')
  @ApiOperation({
    summary: 'Lấy danh sách assignments của reviewer hiện tại',
    description: `Reviewer xem danh sách các bài báo được gán cho mình để review. Có phân trang.`,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng mỗi trang' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách assignments thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền REVIEWER' })
  async getMyAssignments(
    @Req() req: Request,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const assignments = await this.reviewsService.getMyAssignments(
      user.sub,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách assignments thành công',
      data: assignments,
    };
  }
// Lấy danh sách bài nộp trong các track đã chấp nhận của reviewer
  @Get('submissions/accepted-tracks')
  @ApiOperation({
    summary: 'Reviewer xem danh sách bài nộp trong các track đã chấp nhận',
    description: 'Reviewer xem tất cả submissions trong các track mà họ đã chấp nhận.',
    
  })
  @ApiQuery({ name: 'status', required: false, type: String, isArray: true, description: 'Filter by submission status' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách submissions thành công' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ' })
  async getSubmissionsForReviewer(
    @Req() req: Request,
    @Query('status') status?: string | string[],
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    if (!authToken) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    let statusArray: string[] | undefined = undefined;
    
    if (status !== undefined) {
      if (Array.isArray(status)) {
        statusArray = status.length > 0 ? status : undefined;
      } else if (typeof status === 'string') {
        const parsed = status.split(',').map(s => s.trim()).filter(s => s.length > 0);
        statusArray = parsed.length > 0 ? parsed : undefined;
      }
    }
    if (!statusArray || statusArray.length === 0) {
      statusArray = ['SUBMITTED', 'REVIEWING'];
    }
    const submissions = await this.reviewsService.getSubmissionsForReviewer(
      user.sub,
      authToken,
      statusArray,
    );

    return {
      message: 'Lấy danh sách bài nộp thành công',
      data: submissions,
    };
  }
// Reviewer accept an assignment
  @Put('assignments/:id/accept')
  @ApiOperation({
    summary: 'Reviewer chấp nhận assignment',
    description: `Reviewer chấp nhận bài báo được gán để bắt đầu review. Status sẽ chuyển từ PENDING sang ACCEPTED.`
  })
  @ApiParam({ name: 'id', description: 'ID của assignment' })
  @ApiResponse({ status: 200, description: 'Chấp nhận assignment thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền hoặc không phải assignment của reviewer này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy assignment' })
  async acceptAssignment(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const assignment = await this.reviewsService.updateAssignmentStatus(
      id,
      user.sub,
      AssignmentStatus.ACCEPTED,
    );

    return {
      message: 'Chấp nhận assignment thành công',
      data: assignment,
    };
  }
  @Put('assignments/:id/reject')
  @ApiOperation({
    summary: 'Reviewer từ chối assignment',
    description: `Reviewer từ chối bài báo được gán. Status sẽ chuyển từ PENDING sang REJECTED.`
  })
  @ApiParam({ name: 'id', description: 'ID của assignment' })
  @ApiResponse({ status: 200, description: 'Từ chối assignment thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền hoặc không phải assignment của reviewer này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy assignment' })
  async rejectAssignment(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const assignment = await this.reviewsService.updateAssignmentStatus(
      id,
      user.sub,
      AssignmentStatus.REJECTED,
    );

    return {
      message: 'Từ chối assignment thành công',
      data: assignment,
    };
  }
  @Post()
  @ApiOperation({
    summary: 'Reviewer nộp bài chấm',
    description: 'Reviewer nộp kết quả đánh giá cho bài báo. Assignment phải ở trạng thái ACCEPTED.',
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Nộp review thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc assignment chưa được accept' })
  @ApiResponse({ status: 403, description: 'Không có quyền hoặc không phải assignment của reviewer này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy assignment' })
  async submitReview(
    @Req() req: Request,
    @Body() dto: CreateReviewDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    const review = await this.reviewsService.submitReview(user.sub, dto, authToken);

    return {
      message: 'Nộp bài chấm thành công',
      data: review,
    };
  }
// Reviewer self-assign a submission
  @Post('assignments/self')
  @ApiOperation({
    summary: 'Reviewer tự phân công bài báo cho chính mình (Self Assignment)',
    description: 'Reviewer tự phân công một bài báo cho chính mình để review. Chỉ áp dụng khi reviewer đã chấp nhận track assignment.'
  })
  @ApiBody({ type: SelfAssignDto })
  @ApiResponse({ status: 201, description: 'Đã chấp nhận chấm bài' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc có CONFLICT' })
  async selfAssign(
    @Req() req: Request,
    @Body() dto: SelfAssignDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    
    const isReviewer = user.roles?.includes('REVIEWER') || user.roles?.includes('PC_MEMBER');
    if (!isReviewer) {
      throw new ForbiddenException('Chỉ Reviewer mới có thể tự phân công');
    }

    const assignment = await this.reviewsService.selfAssignSubmission(
      user.sub,
      dto.submissionId,
      dto.conferenceId,
    );

    return {
      message: 'Đã chấp nhận chấm bài',
      data: assignment,
    };
  }
// Lấy tất cả reviews của một submission
  @Get('submission/:id')
  @ApiOperation({
    summary: 'Xem tất cả reviews của một submission',
    description: 'Chair/Admin/Reviewer xem danh sách tất cả reviews đã được nộp cho một submission.',
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Lấy danh sách reviews thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem' })
  async getReviewsBySubmission(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) submissionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    const isChairOrAdmin = this.canManageConference(user);
    if (!isChairOrAdmin) {
      const hasAssignment = await this.reviewsService.checkReviewerAssignment(
        user.sub,
        submissionId,
      );
      if (!hasAssignment) {
        throw new ForbiddenException(
          'Bạn không có quyền xem reviews của submission này. Chỉ reviewer được gán bài mới có thể xem.',
        );
      }
    }
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    const reviews = await this.reviewsService.getReviewsBySubmission(
      submissionId,
      query.page,
      query.limit,
      authToken,
    );

    return {
      message: 'Lấy danh sách reviews thành công',
      data: reviews,
    };
  }
  // Lấy reviews đã ẩn danh cho tác giả xem
  @Get('submission/:id/anonymized')
  @ApiOperation({
    summary: 'Xem reviews đã ẩn danh (cho tác giả)',
    description: 'Lấy danh sách reviews đã được ẩn danh để tác giả xem sau khi có quyết định (single-blind review).',
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách reviews ẩn danh thành công' })
  async getAnonymizedReviews(
    @Param('id', ParseUUIDPipe) submissionId: string,
  ) {
    const reviews =
      await this.reviewsService.getAnonymizedReviewsBySubmission(submissionId);

    return {
      message: 'Lấy danh sách reviews ẩn danh thành công',
      data: reviews,
    };
  }
// Chair xem tất cả bids cho một submission
  @Get('bids/submission/:id')
  @ApiOperation({
    summary: 'Chair xem tất cả bids cho một submission',
    description: 'Chair xem danh sách tất cả preferences/bids mà reviewers đã submit cho một submission.',
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bids thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getBidsBySubmission(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) submissionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const bids = await this.reviewsService.getBidsBySubmission(
      submissionId,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách bids thành công',
      data: bids,
    };
  }
// Chair xem tất cả discussions cho một submission
  @Get('discussions/submission/:id')
  @ApiOperation({
    summary: 'Chair xem danh sách thảo luận PC của một submission',
    description: `Chair/Admin xem danh sách tất cả PC discussions về một submission.`,
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thảo luận thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getDiscussionsBySubmission(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) submissionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const discussions = await this.reviewsService.getDiscussionsBySubmission(
      submissionId,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách thảo luận thành công',
      data: discussions,
    };
  }
// lấy tổng hợp reviews và quyết định cho một submission
  @Get('decisions/submission/:id')
  @ApiOperation({
    summary: 'Chair xem tổng hợp reviews và quyết định hiện tại',
    description: 'Chair xem tổng hợp thống kê reviews và quyết định cuối cùng (nếu có) cho một submission.',
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy tổng hợp review và quyết định thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getDecisionSummary(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) submissionId: string,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const summary =
      await this.reviewsService.getDecisionSummaryBySubmission(submissionId);

    return {
      message: 'Lấy tổng hợp review và quyết định thành công',
      data: summary,
    };
  }

  @Post('decisions')
  @ApiOperation({
    summary: 'Chair set/update quyết định cuối cùng cho submission',
    description: 'Chair/Admin set hoặc cập nhật quyết định cuối cùng cho một submission sau khi đã có đủ reviews.',
    
  })
  @ApiBody({ type: CreateDecisionDto })
  @ApiResponse({ status: 201, description: 'Cập nhật quyết định cuối cùng thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền set decision' })
  async setDecision(
    @Req() req: Request,
    @Body() dto: CreateDecisionDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const decision = await this.reviewsService.upsertDecisionForSubmission(
      dto.submissionId,
      user.sub,
      dto.decision,
      dto.note,
    );

    const summary =
      await this.reviewsService.getDecisionSummaryBySubmission(
        dto.submissionId,
      );

    return {
      message: 'Cập nhật quyết định cuối cùng thành công',
      data: {
        decision,
        summary,
      },
    };
  }
// lấy tiến độ review cho một submission
  @Get('progress/submission/:id')
  @ApiOperation({
    summary: 'Chair xem tiến độ review của một submission',
    description: 'Chair xem các metrics về tiến độ review cho một submission cụ thể.',
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy tiến độ review của bài báo thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getSubmissionProgress(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) submissionId: string,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const progress =
      await this.reviewsService.getSubmissionProgress(submissionId);

    return {
      message: 'Lấy tiến độ review của bài báo thành công',
      data: progress,
    };
  }

  // lấy tiến độ review cho cả hội nghị
  @Get('progress/conference/:id')
  @ApiOperation({
    summary: 'Chair xem tiến độ review của cả hội nghị',
    description: 'Chair xem các metrics tổng hợp về tiến độ review cho toàn bộ submissions trong một conference.',
  })
  @ApiParam({ name: 'id', description: 'ID của conference' })
  @ApiResponse({ status: 200, description: 'Lấy tiến độ review của hội nghị thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getConferenceProgress(
    @Req() req: Request,
    @Param('id', ParseIntPipe) conferenceId: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const progress =
      await this.reviewsService.getConferenceProgress(conferenceId);

    return {
      message: 'Lấy tiến độ review của hội nghị thành công',
      data: progress,
    };
  }
// Lấy thống kê hoạt động reviewer
  @Get('reviewer/:reviewerId/stats')
  @ApiOperation({ summary: 'Lấy thống kê hoạt động reviewer (Guard Clause - Internal)' })
  @ApiParam({ name: 'reviewerId', description: 'ID của reviewer' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công' })
  async getReviewerActivityStats(
    @Param('reviewerId', ParseIntPipe) reviewerId: number,
  ) {
    const stats = await this.reviewsService.getReviewerActivityStats(reviewerId);
    return {
      message: 'Lấy thống kê hoạt động reviewer thành công',
      data: stats,
    };
  }
}






