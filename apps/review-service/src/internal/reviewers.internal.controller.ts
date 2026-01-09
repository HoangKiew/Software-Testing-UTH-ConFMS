import { Controller, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@ApiTags('Internal PcMembers')
@Controller('internal/reviewers')
export class PcMembersInternalController {
  constructor(private readonly http: HttpService) {}

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Internal: Chấp nhận lời mời tham gia PC' })
  @ApiParam({ name: 'id', description: 'ID lời mời (conference member ID)', type: String })
  @ApiResponse({ status: 200, description: 'Đã chấp nhận lời mời' })
  async acceptInvite(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const url = `http://conference-service:3002/api/internal/reviewers/${id}/accept`;
    const headers = { Authorization: req?.headers?.authorization };
    const res$ = this.http.patch(url, body || {}, { headers });
    const res = await lastValueFrom(res$);
    return res.data;
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Internal: Từ chối lời mời tham gia PC' })
  @ApiParam({ name: 'id', description: 'ID lời mời (conference member ID)', type: String })
  @ApiResponse({ status: 200, description: 'Đã từ chối lời mời' })
  async declineInvite(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const url = `http://conference-service:3002/api/internal/reviewers/${id}/decline`;
    const headers = { Authorization: req?.headers?.authorization };
    const res$ = this.http.patch(url, body || {}, { headers });
    const res = await lastValueFrom(res$);
    return res.data;
  }

  @Patch(':id/coi')
  @ApiOperation({ summary: 'Internal: Khai báo xung đột lợi ích (COI) cho PC Member' })
  @ApiParam({ name: 'id', description: 'ID PC Member', type: String })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: 'COI đã được cập nhật' })
  async declareCoi(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const url = `http://conference-service:3002/api/internal/reviewers/${id}/coi`;
    const headers = { Authorization: req?.headers?.authorization };
    const res$ = this.http.patch(url, dto || {}, { headers });
    const res = await lastValueFrom(res$);
    return res.data;
  }

  @Patch(':id/topics')
  @ApiOperation({ summary: 'Internal: Cập nhật danh sách chuyên môn (topics) của PC Member' })
  @ApiParam({ name: 'id', description: 'ID PC Member', type: String })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: 'Topics đã được cập nhật' })
  async updateTopics(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const url = `http://conference-service:3002/api/internal/reviewers/${id}/topics`;
    const headers = { Authorization: req?.headers?.authorization };
    const res$ = this.http.patch(url, dto || {}, { headers });
    const res = await lastValueFrom(res$);
    return res.data;
  }
}
