import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ConferencesService } from '../conferences/conferences.service';

@ApiTags('Audit Logs')
@Controller('conferences/:conferenceId/audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly conferencesService: ConferencesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách hoạt động của hội nghị',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy audit logs thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getAuditLogs(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      { id: user.sub, roles: user.roles },
    );

    const logs = await this.auditService.findAll(conferenceId);

    return {
      message: 'Lấy audit logs thành công',
      data: logs,
    };
  }
}

