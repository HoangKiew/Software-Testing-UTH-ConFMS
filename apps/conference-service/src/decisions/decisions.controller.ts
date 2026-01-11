// apps/conference-service/src/decisions/decisions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { DecisionsService } from './decisions.service';
import { MakeDecisionDto } from './dto/make-decision.dto';
import { BulkDecisionDto } from './dto/bulk-decision.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

@ApiTags('decisions')
@ApiBearerAuth('JWT-auth')
@Controller('decisions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DecisionsController {
  private readonly logger = new Logger(DecisionsController.name);

  constructor(private readonly decisionsService: DecisionsService) {}

  private logRequest(
    userId: number,
    action: string,
    context?: string,
  ): void {
    this.logger.log(`User ${userId} → ${action}${context ? ` ${context}` : ''}`);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Lấy tóm tắt để ra quyết định
  // ──────────────────────────────────────────────────────────────────────────────
  @Get('conference/:id/summary')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Lấy tóm tắt bài nộp kèm điểm đánh giá để Chair xem trước khi ra quyết định',
    description:
      'Trả về danh sách bài nộp với điểm trung bình, số lượng review và trạng thái sẵn sàng ra quyết định',
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị', example: '7dad116a-475a-40f6-9958-5c922c97821e' })
  @ApiResponse({ status: 200, description: 'Tóm tắt quyết định được lấy thành công' })
  @ApiForbiddenResponse({ description: 'Không có quyền - chỉ Chair hoặc Admin của hội nghị' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getDecisionSummary(
    @Param('id') conferenceId: string,
    @CurrentUser() user: { userId: number; roles: string[] },  // ← Sửa: lấy đầy đủ user object
  ) {
    this.logRequest(user.userId, 'GET tóm tắt quyết định', `hội nghị ${conferenceId}`);
    return this.decisionsService.getSummaryForConference(
      conferenceId,
      user.userId,
      user.roles,  // ← Truyền roles cho service
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Ra quyết định cho một bài nộp
  // ──────────────────────────────────────────────────────────────────────────────
  @Post('single')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Ra quyết định cho một bài nộp đơn lẻ' })
  @ApiBody({ type: MakeDecisionDto })
  @ApiCreatedResponse({ description: 'Quyết định đã được ghi nhận và gửi thông báo' })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ, bài nộp không tồn tại hoặc đã ra quyết định',
  })
  @ApiForbiddenResponse({ description: 'Không có quyền - chỉ Chair hoặc ADMIN của hội nghị' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async makeSingleDecision(
    @Body() dto: MakeDecisionDto,
    @CurrentUser() user: { userId: number; roles: string[] },
  ) {
    this.logRequest(user.userId, 'POST quyết định đơn', `bài nộp ${dto.submissionId}`);
    return this.decisionsService.makeDecision(dto, user.userId, user.roles);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Ra quyết định hàng loạt
  // ──────────────────────────────────────────────────────────────────────────────
  @Post('bulk')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Ra quyết định hàng loạt cho nhiều bài nộp',
    description: 'Hỗ trợ xử lý từng phần; trả về kết quả chi tiết cho từng bài nộp',
  })
  @ApiBody({ type: BulkDecisionDto })
  @ApiCreatedResponse({ description: 'Quá trình ra quyết định hàng loạt hoàn tất (có thể có một số thất bại)' })
  @ApiBadRequestResponse({ description: 'Dữ liệu hàng loạt không hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền - thiếu quyền truy cập' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async makeBulkDecisions(
    @Body() dto: BulkDecisionDto,
    @CurrentUser() user: { userId: number; roles: string[] },
  ) {
    this.logRequest(user.userId, 'POST quyết định hàng loạt', `${dto.decisions.length} bài nộp`);
    return this.decisionsService.makeBulkDecisions(dto, user.userId, user.roles);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Tự động ra quyết định cho tất cả bài đang chờ
  // ──────────────────────────────────────────────────────────────────────────────
  @Post('conference/:id/make-all')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Tự động ra quyết định cho tất cả bài nộp đang ở trạng thái UNDER_REVIEW',
    description:
      'Dựa trên điểm trung bình (ví dụ: ≥3.5 → Chấp nhận, còn lại → Từ chối). Trả về số lượng thành công/thất bại',
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiCreatedResponse({ description: 'Quá trình tự động ra quyết định hoàn tất' })
  @ApiForbiddenResponse({ description: 'Không có quyền - chỉ Chair hoặc ADMIN của hội nghị' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async autoMakeAllDecisions(
    @Param('id') conferenceId: string,
    @CurrentUser() user: { userId: number; roles: string[] },
  ) {
    this.logRequest(user.userId, 'POST tự động quyết định toàn bộ', `hội nghị ${conferenceId}`);
    return this.decisionsService.makeAllDecisions(conferenceId, user.userId, user.roles);
  }
}