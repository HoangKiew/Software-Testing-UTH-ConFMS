// apps/conference-service/src/reports/reports.controller.ts

import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../common/role.enum';

// Swagger imports
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('conference/:id/overview')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Lấy báo cáo tổng quan hội nghị (số lượng bài nộp, accept rate, trạng thái...)' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị', type: String })
  @ApiResponse({ status: 200, description: 'Báo cáo tổng quan dưới dạng JSON' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair hoặc Admin mới được xem' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getOverview(@Param('id') conferenceId: string) {
    return this.reportsService.getOverview(conferenceId);
  }

  @Get('conference/:id/track-stats')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Thống kê bài nộp theo từng Track của hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị', type: String })
  @ApiResponse({ status: 200, description: 'Danh sách track kèm số lượng bài nộp, accept, reject...' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair hoặc Admin mới được xem' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getTrackStats(@Param('id') conferenceId: string) {
    return this.reportsService.getTrackStats(conferenceId);
  }

  @Get('conference/:id/institution-stats')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Thống kê bài nộp theo cơ quan/tổ chức (institution)' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị', type: String })
  @ApiResponse({ status: 200, description: 'Top institutions theo số lượng bài nộp' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair hoặc Admin mới được xem' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getInstitutionStats(@Param('id') conferenceId: string) {
    return this.reportsService.getInstitutionStats(conferenceId);
  }

  @Get('conference/:id/review-sla')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ summary: 'Báo cáo tuân thủ thời hạn review (Review SLA) của PC Members' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị', type: String })
  @ApiResponse({ status: 200, description: 'Thống kê thời gian review trung bình, trễ hạn, đúng hạn...' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair hoặc Admin mới được xem' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getReviewSLA(@Param('id') conferenceId: string) {
    return this.reportsService.getReviewSLA(conferenceId);
  }

  @Get('conference/:id/proceedings')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({ 
    summary: 'Xuất proceedings (danh sách bài chấp nhận) dưới dạng file CSV hoặc PDF' 
  })
  @ApiParam({ name: 'id', description: 'ID của hội nghị', type: String })
  @ApiQuery({ 
    name: 'format', 
    enum: ['csv', 'pdf'], 
    description: 'Định dạng file xuất ra', 
    example: 'csv',
    required: false 
  })
  @ApiProduces('text/csv', 'application/pdf')
  @ApiResponse({ 
    status: 200, 
    description: 'File proceedings được trả về dưới dạng attachment',
    content: {
      'text/csv': { schema: { type: 'string', format: 'binary' } },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    }
  })
  @ApiResponse({ status: 403, description: 'Chỉ Chair hoặc Admin mới được xuất' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  @ApiResponse({ status: 400, description: 'Format không hợp lệ' })
  async exportProceedings(
    @Param('id') conferenceId: string,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response,
  ) {
    if (format === 'pdf') {
      const buffer = await this.reportsService.exportProceedingsPdf(conferenceId);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proceedings_${conferenceId}.pdf"`,
      });
      return res.send(buffer);
    }

    const csv = await this.reportsService.exportProceedingsCsv(conferenceId);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${csv.filename}"`,
    });
    return res.send(csv.data);
  }
}