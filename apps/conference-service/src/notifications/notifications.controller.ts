import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ConferencesService } from '../conferences/conferences.service';

@ApiTags('Notifications')
@Controller('conferences/:conferenceId/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly conferencesService: ConferencesService,
  ) {}
// Tạo email hàng loạt
  @Post('bulk')
  @ApiOperation({
    summary: 'Gửi email hàng loạt',
    description: 'Gửi email hàng loạt cho nhiều người cùng lúc (PC members, Authors, Reviewers, hoặc Chairs). Có thể sử dụng email template hoặc custom body.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Gửi email hàng loạt thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị hoặc template' })
  async sendBulkNotification(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() dto: BulkNotificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      { id: user.sub, roles: user.roles },
    );

    const result = await this.notificationsService.sendBulkNotification(
      conferenceId,
      dto,
    );

    return {
      message: 'Gửi email hàng loạt thành công',
      data: result,
    };
  }
// Xem trước email trước khi gửi
  @Post('preview')
  @ApiOperation({
    summary: 'Preview email trước khi gửi',
    description: `Xem trước nội dung email với template và variables trước khi gửi thực sự.`,
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Preview email thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị hoặc template' })
  async previewNotification(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() dto: BulkNotificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      { id: user.sub, roles: user.roles },
    );

    const preview = await this.notificationsService.previewNotification(
      conferenceId,
      dto,
    );

    return {
      message: 'Preview email thành công',
      data: preview,
    };
  }
}

