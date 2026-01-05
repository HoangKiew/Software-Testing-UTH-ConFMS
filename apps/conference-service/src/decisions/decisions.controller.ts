// apps/conference-service/src/decisions/decisions.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { MakeDecisionDto } from './dto/make-decision.dto';
import { BulkDecisionDto } from './dto/bulk-decision.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

// Swagger imports
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Decisions')
@ApiBearerAuth('JWT-auth')
@Controller('decisions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Get('conference/:id/summary')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Lấy tổng quan quyết định bài báo của hội nghị' })
  @ApiParam({ name: 'id', description: 'ID hội nghị', type: String })
  @ApiResponse({ status: 200, description: 'Thống kê: số accept, reject, pending, accept rate...' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được xem' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getSummary(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.decisionsService.getSummaryForConference(conferenceId, chairId);
  }

  @Post('single')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Ra quyết định cho một bài nộp duy nhất' })
  @ApiBody({ type: MakeDecisionDto })
  @ApiResponse({ status: 201, description: 'Quyết định đã được ghi nhận' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc submission không tồn tại' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được ra quyết định' })
  @ApiResponse({ status: 409, description: 'Bài nộp đã có quyết định trước đó' })
  async makeDecision(
    @Body() dto: MakeDecisionDto,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.decisionsService.makeDecision(dto, chairId);
  }

  @Post('bulk')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Ra quyết định hàng loạt cho nhiều bài nộp cùng lúc' })
  @ApiBody({ type: BulkDecisionDto })
  @ApiResponse({ status: 201, description: 'Tất cả quyết định đã được xử lý' })
  @ApiResponse({ status: 400, description: 'Có lỗi trong một hoặc nhiều quyết định' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được thực hiện' })
  async makeBulkDecisions(
    @Body() dto: BulkDecisionDto,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.decisionsService.makeBulkDecisions(dto, chairId);
  }

  @Post('conference/:id/make-all')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ 
    summary: 'Tự động ra quyết định cho tất cả bài nộp chưa có quyết định (theo ngưỡng điểm review)' 
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị', type: String })
  @ApiResponse({ status: 201, description: 'Đã xử lý quyết định tự động cho tất cả bài còn lại' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được thực hiện' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async makeAllDecisions(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.decisionsService.makeAllDecisions(conferenceId, chairId);
  }
}