import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ConferencesService } from '../conferences/conferences.service';

@ApiTags('Reporting')
@Controller('conferences/:conferenceId/stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly conferencesService: ConferencesService,
  ) {}
  // Lấy thống kê tổng quan của hội nghị
  @Get()
  @ApiOperation({
    summary: 'Lấy thống kê tổng quan của hội nghị',
    description:
      'Lấy các thống kê tổng quan như số tracks, số members, số members theo role.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getStats(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const stats = await this.reportingService.getConferenceStats(conferenceId);

    return {
      message: 'Lấy thống kê thành công',
      data: stats,
    };
  }
  // Lấy thống kê về submissions
  @Get('submissions')
  @ApiOperation({
    summary: 'Lấy thống kê về submissions',
    description:
      'Lấy thống kê về submissions của hội nghị (cần tích hợp với submission-service để lấy dữ liệu thực tế).',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê submissions thành công',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getSubmissionStats(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : '';

    const stats = await this.reportingService.getSubmissionStats(
      conferenceId,
      authToken,
    );

    return {
      message: 'Lấy thống kê submissions thành công',
      data: stats,
    };
  }
  // Lấy tỷ lệ chấp nhận
  @Get('acceptance-rate')
  @ApiOperation({
    summary: 'Lấy tỷ lệ chấp nhận (acceptance rate)',
    description:
      'Lấy tỷ lệ chấp nhận bài báo của hội nghị (cần tích hợp với submission-service để lấy dữ liệu thực tế).',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy tỷ lệ chấp nhận thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getAcceptanceRate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : '';

    const stats = await this.reportingService.getAcceptanceRate(
      conferenceId,
      authToken,
    );

    return {
      message: 'Lấy tỷ lệ chấp nhận thành công',
      data: stats,
    };
  }

  // Lấy thống kê dashboard
  @Get('dashboard')
  @ApiOperation({
    summary: 'Lấy thống kê dashboard',
    description:
      'Lấy thống kê tổng hợp cho dashboard bao gồm submissions, acceptance rate, reviewers, và phân bố theo track.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê dashboard thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getDashboardStats(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : '';

    const stats = await this.reportingService.getDashboardStats(
      conferenceId,
      authToken,
    );

    return {
      message: 'Lấy thống kê dashboard thành công',
      data: stats,
    };
  }
}
