import { Controller, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { PcMembersService } from './pc-members.service';
import { DeclareCoiDto } from './dto/declare-coi.dto';
import { UpdatePcMemberTopicsDto } from './dto/update-pc-member-topics.dto';

@ApiTags('Internal PcMembers')
@Controller('internal/reviewers')
export class PcMembersInternalController {
  constructor(private readonly pcMembersService: PcMembersService) {}

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Internal: Chấp nhận lời mời tham gia PC' })
  @ApiParam({ name: 'id', description: 'ID lời mời (conference member ID)', type: String })
  @ApiResponse({ status: 200, description: 'Đã chấp nhận lời mời' })
  async acceptInvite(@Param('id') id: string, @Body() body: any) {
    // body may contain the acting user id when called internally
    const userId = body?.userId;
    return this.pcMembersService.acceptInvite(id, userId);
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Internal: Từ chối lời mời tham gia PC' })
  @ApiParam({ name: 'id', description: 'ID lời mời (conference member ID)', type: String })
  @ApiResponse({ status: 200, description: 'Đã từ chối lời mời' })
  async declineInvite(@Param('id') id: string, @Body() body: any) {
    const userId = body?.userId;
    return this.pcMembersService.declineInvite(id, userId);
  }

  @Patch(':id/coi')
  @ApiOperation({ summary: 'Internal: Khai báo xung đột lợi ích (COI) cho PC Member' })
  @ApiParam({ name: 'id', description: 'ID PC Member', type: String })
  @ApiBody({ type: DeclareCoiDto })
  @ApiResponse({ status: 200, description: 'COI đã được cập nhật' })
  async declareCoi(@Param('id') id: string, @Body() dto: any) {
    return this.pcMembersService.declareCoi(id, dto.coiUserIds, dto.coiInstitutions, dto.userId);
  }

  @Patch(':id/topics')
  @ApiOperation({ summary: 'Internal: Cập nhật danh sách chuyên môn (topics) của PC Member' })
  @ApiParam({ name: 'id', description: 'ID PC Member', type: String })
  @ApiBody({ type: UpdatePcMemberTopicsDto })
  @ApiResponse({ status: 200, description: 'Topics đã được cập nhật' })
  async updateTopics(@Param('id') id: string, @Body() dto: any) {
    return this.pcMembersService.updateTopics(id, dto.topics, dto.userId);
  }
}
