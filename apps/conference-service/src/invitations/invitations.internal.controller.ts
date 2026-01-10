// apps/conference-service/src/invitations/invitations.internal.controller.ts

import { Controller, Patch, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiExcludeController, // ← Import cái này (ẩn toàn bộ controller)
} from '@nestjs/swagger';

import { InvitationsService } from './invitations.service';

@ApiExcludeController() // ← ẨN TOÀN BỘ CONTROLLER NÀY KHỎI SWAGGER
@ApiTags('Internal Invitations') // Giữ lại cho developer đọc code, nhưng tag sẽ không hiện
@Controller('internal/invitations')
export class InvitationsInternalController {
  constructor(private readonly invitationsService: InvitationsService) { }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Internal: Chấp nhận lời mời tham gia phản biện' })
  @ApiParam({ name: 'id', description: 'ID của lời mời', type: String })
  @ApiResponse({ status: 200, description: 'Đã chấp nhận lời mời, role REVIEWER đã được thêm' })
  async acceptInvitation(@Param('id') id: string, @Body() body: { userId?: number }) {
    const userId = body?.userId;
    return this.invitationsService.acceptInvitation(id, userId);
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: 'Internal: Từ chối lời mời tham gia phản biện' })
  @ApiParam({ name: 'id', description: 'ID của lời mời', type: String })
  @ApiResponse({ status: 200, description: 'Đã từ chối lời mời' })
  async declineInvitation(@Param('id') id: string, @Body() body: { userId?: number }) {
    const userId = body?.userId;
    return this.invitationsService.declineInvitation(id, userId);
  }
}