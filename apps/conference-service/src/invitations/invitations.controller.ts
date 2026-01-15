// apps/conference-service/src/invitations/invitations.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiExcludeEndpoint, // Ẩn endpoint khỏi Swagger
} from '@nestjs/swagger';

import { InvitationsService } from './invitations.service';
import { InviteReviewerDto } from './dto/invite-reviewer.dto';
import { UpdateTopicsDto } from './dto/update-topics.dto';
import { UpdateCoiDto } from './dto/update-coi.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

/**
 * Public controller quản lý lời mời reviewer
 * - Chair: mời, xem danh sách, xóa
 * - Reviewer: chấp nhận/từ chối, xem pending, cập nhật topics/coi (ẩn khỏi Swagger, role REVIEWER)
 */
@ApiTags('Invitations')
@ApiBearerAuth('JWT-auth')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) { }

  // Chair mời reviewer
  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Chair mời reviewer tham gia hội nghị (dùng userId)' })
  @ApiResponse({ status: 201, description: 'Lời mời đã được gửi' })
  async inviteReviewer(
    @Body() dto: InviteReviewerDto,
    @CurrentUser('userId') chairId: number,
  ) {
    // ──────────────────────────────────────────────────────────────────────────────
    // SỬA: truyền thêm dto.email vào service (nếu Chair gửi kèm)
    // ──────────────────────────────────────────────────────────────────────────────
    return this.invitationsService.inviteReviewer(
      dto.conferenceId,
      dto.userId,
      chairId,
      dto.email,  // ← Truyền email từ body vào service
    );
  }

  // Chair xem danh sách reviewer đã chấp nhận
  @Get('conference/:conferenceId/accepted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách reviewer đã chấp nhận của hội nghị' })
  async getAcceptedReviewers(
    @Param('conferenceId') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.invitationsService.getAcceptedReviewers(conferenceId, chairId);
  }

  // Chair xóa lời mời hoặc reviewer
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Xóa lời mời hoặc reviewer khỏi hội nghị' })
  async removeInvitation(
    @Param('id') invitationId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.invitationsService.removeInvitation(invitationId, chairId);
  }

  // Reviewer chấp nhận lời mời - ẨN & YÊU CẦU ROLE REVIEWER
  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.REVIEWER) // ← Bắt buộc phải có role REVIEWER
  @ApiExcludeEndpoint() // ← Ẩn khỏi Swagger
  @ApiOperation({ summary: 'Reviewer chấp nhận lời mời tham gia hội nghị' })
  @ApiResponse({ status: 200, description: 'Chấp nhận thành công, role REVIEWER đã được thêm' })
  async acceptInvitation(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.invitationsService.acceptInvitation(id, userId);
  }

  // Reviewer từ chối lời mời - ẨN & YÊU CẦU ROLE REVIEWER
  @Patch(':id/decline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.REVIEWER) // ← Bắt buộc phải có role REVIEWER
  @ApiExcludeEndpoint() // ← Ẩn khỏi Swagger
  @ApiOperation({ summary: 'Reviewer từ chối lời mời tham gia hội nghị' })
  async declineInvitation(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.invitationsService.declineInvitation(id, userId);
  }

  // Reviewer cập nhật topics - ẨN & YÊU CẦU ROLE REVIEWER
  @Patch(':id/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.REVIEWER)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Reviewer cập nhật chuyên môn (topics) cho hội nghị này' })
  @ApiBody({ type: UpdateTopicsDto })
  async updateTopics(
    @Param('id') id: string,
    @Body() dto: UpdateTopicsDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.invitationsService.updateTopics(id, dto.topics, userId);
  }

  // Reviewer cập nhật COI - ẨN & YÊU CẦU ROLE REVIEWER
  @Patch(':id/coi')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.REVIEWER)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Reviewer cập nhật xung đột lợi ích (COI) cho hội nghị này' })
  @ApiBody({ type: UpdateCoiDto })
  async updateCoi(
    @Param('id') id: string,
    @Body() dto: UpdateCoiDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.invitationsService.updateCoi(id, dto.coiUserIds, dto.coiInstitutions, userId);
  }

  // Reviewer xem lời mời pending của mình - ẨN & YÊU CẦU ROLE REVIEWER
  @Get('my-pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.REVIEWER) // ← Bắt buộc phải có role REVIEWER
  @ApiExcludeEndpoint() // ← Ẩn khỏi Swagger
  @ApiOperation({ summary: 'Lấy danh sách lời mời đang chờ chấp nhận của tôi' })
  async getMyPendingInvitations(@CurrentUser('userId') userId: number) {
    return this.invitationsService.getMyPendingInvitations(userId);
  }
}