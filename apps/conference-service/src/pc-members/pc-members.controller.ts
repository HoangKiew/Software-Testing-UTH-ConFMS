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
} from '@nestjs/common';
import { PcMembersService } from './pc-members.service';
import { InvitePcMemberDto } from './dto/invite-pc-member.dto';
import { DeclareCoiDto } from './dto/declare-coi.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';
import { UpdateTopicsDto } from './dto/update-topics.dto';
import { SubmissionsClient } from '../integrations/submissions.client';

// ← THÊM 2 IMPORT CHO SWAGGER
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('PC Members')           // Nhóm endpoint đẹp trong Swagger
@ApiBearerAuth('JWT-auth')       // ← QUAN TRỌNG: Bắt Swagger tự động thêm token
@Controller('pc-members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PcMembersController {
  constructor(
    private readonly pcMembersService: PcMembersService,
    private readonly submissionsClient: SubmissionsClient,
  ) {}

  // ✅ ĐÃ SỬA: Giờ chỉ truyền object dto và chairId
  @Post('invite')
  @Roles(RoleName.CHAIR)
  async invite(
    @Body() dto: InvitePcMemberDto,
    @CurrentUser('userId') chairId: number,
  ) {
    // dto lúc này chỉ có: conferenceId, userId, role? (email đã bị loại bỏ)
    return this.pcMembersService.invite(
      {
        conferenceId: dto.conferenceId,
        userId: dto.userId,
        role: dto.role, // optional
      },
      chairId,
    );
  }

  @Get('conference/:id')
  @Roles(RoleName.CHAIR)
  async findAllByConference(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.pcMembersService.findAllByConference(conferenceId, chairId);
  }

  @Patch(':id/accept')
  async acceptInvite(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.pcMembersService.acceptInvite(id, userId);
  }

  @Patch(':id/decline')
  async declineInvite(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.pcMembersService.declineInvite(id, userId);
  }

  @Patch(':id/coi')
  async declareCoi(
    @Param('id') id: string,
    @Body() dto: DeclareCoiDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.pcMembersService.declareCoi(
      id,
      dto.coiUserIds,
      dto.coiInstitutions,
      userId,
    );
  }

  @Delete(':id')
  @Roles(RoleName.CHAIR)
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.pcMembersService.removeMember(id, chairId);
  }

  @Get(':id/similarity/:submissionId')
  @Roles(RoleName.CHAIR)
  async getSimilarity(
    @Param('id') memberId: string,
    @Param('submissionId') submissionId: string,
  ) {
    const submission = await this.submissionsClient.getSubmission(submissionId);
    const member = await this.pcMembersService.findOne(memberId);

    const keywords = (submission.keywords || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean);

    return this.pcMembersService.getSimilaritySuggestion(
      member.conference.id,
      keywords,
      memberId,
    );
  }

  @Patch(':id/topics')
  async updateTopics(
    @Param('id') id: string,
    @Body() dto: UpdateTopicsDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.pcMembersService.updateTopics(id, dto.topics, userId);
  }
}