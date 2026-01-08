// apps/conference-service/src/pc-members/pc-members.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,   // ← THÊM IMPORT NÀY
} from '@nestjs/common';
import { PcMembersService } from './pc-members.service';
import { InvitePcMemberDto } from './dto/invite-pc-member.dto';
import { UpdatePcMemberTopicsDto } from './dto/update-pc-member-topics.dto';
import { SubmissionsClient } from '../integrations/submissions.client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Chairs')
@ApiBearerAuth('JWT-auth')
@Controller('reviewers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PcMembersController {
  constructor(
    private readonly pcMembersService: PcMembersService,
    private readonly submissionsClient: SubmissionsClient,
  ) { }

  @Post('invite')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Mời reviewer vào hội nghị (dùng userId)' })
  async invite(@Body() dto: InvitePcMemberDto, @CurrentUser('userId') chairId: number) {
    return this.pcMembersService.invite(dto, chairId);
  }

  @Get('conference/:conferenceId')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách tất cả reviewer của hội nghị' })
  async findAllByConference(
    @Param('conferenceId') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.pcMembersService.findAllByConference(conferenceId, chairId);
  }

  @Delete('user/:userId/conference/:conferenceId')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Xóa reviewer khỏi hội nghị (dùng userId)' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID của reviewer' })
  @ApiParam({ name: 'conferenceId', type: String, description: 'ID hội nghị' })
  async removeByUserId(
    @Param('userId') userId: number,
    @Param('conferenceId') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.pcMembersService.removeMemberByUserIdAndConference(userId, conferenceId, chairId);
  }

  @Get('user/:userId/similarity/:submissionId')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Tính độ tương đồng giữa reviewer (dùng userId) và bài nộp' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID của reviewer' })
  @ApiParam({ name: 'submissionId', type: String })
  async getSimilarityByUserId(
    @Param('userId') userId: number,
    @Param('submissionId') submissionId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.pcMembersService.getSimilarityByUserId(userId, submissionId, chairId);
  }

  // ✅ SỬA: Endpoint cập nhật topics bằng userId
  @Patch('user/:userId/topics')
  @UseGuards(JwtAuthGuard) // Không cần RolesGuard vì reviewer tự cập nhật, không phải chair
  @ApiOperation({ summary: 'Reviewer tự cập nhật chuyên môn (topics) của mình' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID của reviewer' })
  @ApiBody({ type: UpdatePcMemberTopicsDto })
  async updateTopicsByUserId(
    @Param('userId') userId: number,
    @Body() dto: UpdatePcMemberTopicsDto,
    @CurrentUser('userId') currentUserId: number,
  ) {
    if (userId !== currentUserId) {
      throw new ForbiddenException('Bạn chỉ có thể cập nhật topics của chính mình');
    }

    // Gọi method mới sẽ thêm ở service (xem bên dưới)
    return this.pcMembersService.updateTopicsByUserId(userId, dto.topics, currentUserId);
  }
}