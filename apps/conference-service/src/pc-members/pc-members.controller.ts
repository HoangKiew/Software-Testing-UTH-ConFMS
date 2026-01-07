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
import { UpdatePcMemberTopicsDto } from './dto/update-pc-member-topics.dto';  // ✅ ĐÃ SỬA
import { SubmissionsClient } from '../integrations/submissions.client';
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

@ApiTags('PC Members')
@ApiBearerAuth('JWT-auth')
@Controller('pc-members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PcMembersController {
  constructor(
    private readonly pcMembersService: PcMembersService,
    private readonly submissionsClient: SubmissionsClient,
  ) { }

  @Post('invite')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Mời thành viên PC vào hội nghị (dựa trên userId, email lấy tự động)' })
  @ApiBody({ type: InvitePcMemberDto })
  @ApiResponse({ status: 201, description: 'Lời mời đã được gửi' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc user không tồn tại' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được mời' })
  @ApiResponse({ status: 409, description: 'User đã là thành viên' })
  async invite(
    @Body() dto: InvitePcMemberDto,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.pcMembersService.invite(
      {
        conferenceId: dto.conferenceId,
        userId: dto.userId,
        role: dto.role,
      },
      chairId,
    );
  }

  @Get('conference/:id')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách tất cả PC Members của hội nghị' })
  @ApiParam({ name: 'id', description: 'ID hội nghị', type: String })
  @ApiResponse({ status: 200, description: 'Danh sách thành viên PC (tên, role, status...)' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được xem' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async findAllByConference(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.pcMembersService.findAllByConference(conferenceId, chairId);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Chấp nhận lời mời tham gia PC' })
  @ApiParam({ name: 'id', description: 'ID lời mời (conference member ID)', type: String })
  @ApiResponse({ status: 200, description: 'Đã chấp nhận lời mời' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lời mời' })
  @ApiResponse({ status: 403, description: 'Không phải người nhận lời mời' })
  async acceptInvite(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.pcMembersService.acceptInvite(id, userId);
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Từ chối lời mời tham gia PC' })
  @ApiParam({ name: 'id', description: 'ID lời mời (conference member ID)', type: String })
  @ApiResponse({ status: 200, description: 'Đã từ chối lời mời' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lời mời' })
  @ApiResponse({ status: 403, description: 'Không phải người nhận lời mời' })
  async declineInvite(
    @Param('id') id: string,
    @CurrentUser('userId') userId: number,
  ) {
    return this.pcMembersService.declineInvite(id, userId);
  }

  @Patch(':id/coi')
  @ApiOperation({ summary: 'Khai báo xung đột lợi ích (COI) cho PC Member' })
  @ApiParam({ name: 'id', description: 'ID PC Member', type: String })
  @ApiBody({ type: DeclareCoiDto })
  @ApiResponse({ status: 200, description: 'COI đã được cập nhật' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ bản thân PC Member mới được khai báo' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy PC Member' })
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
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Xóa thành viên khỏi PC hội nghị' })
  @ApiParam({ name: 'id', description: 'ID PC Member', type: String })
  @ApiResponse({ status: 200, description: 'Thành viên đã bị xóa' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thành viên' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.pcMembersService.removeMember(id, chairId);
  }

  @Get(':id/similarity/:submissionId')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Tính độ tương đồng giữa PC Member và bài nộp (dựa trên keywords)' })
  @ApiParam({ name: 'id', description: 'ID PC Member', type: String })
  @ApiParam({ name: 'submissionId', description: 'ID bài nộp', type: String })
  @ApiResponse({ status: 200, description: 'Điểm similarity và gợi ý phân công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair mới được tính' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy member hoặc submission' })
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
  @ApiOperation({ summary: 'Cập nhật danh sách chuyên môn (topics) của PC Member' })
  @ApiParam({ name: 'id', description: 'ID PC Member', type: String })
  @ApiBody({ type: UpdatePcMemberTopicsDto })  // ✅ ĐÃ SỬA
  @ApiResponse({ status: 200, description: 'Topics đã được cập nhật' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ bản thân PC Member mới được cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy PC Member' })
  async updateTopics(
    @Param('id') id: string,
    @Body() dto: UpdatePcMemberTopicsDto,  // ✅ ĐÃ SỬA
    @CurrentUser('userId') userId: number,
  ) {
    return this.pcMembersService.updateTopics(id, dto.topics, userId);
  }
}