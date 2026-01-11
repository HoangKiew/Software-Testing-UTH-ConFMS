// apps/conference-service/src/reports/reports.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiProduces,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth') // ← Sửa ở đây: thêm tên 'JWT-auth' để popup token hiển thị đúng
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) { }

  private logRequest(
    userId: number,
    conferenceId: string,
    endpoint: string,
    extra?: string,
  ): void {
    this.logger.log(
      `User ${userId} → GET /reports/conference/${conferenceId}/${endpoint}${extra ? ` ${extra}` : ''}`,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Báo cáo tổng quan hội nghị
  // ──────────────────────────────────────────────────────────────────────────────
  @Get('conference/:id/overview')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Lấy báo cáo tổng quan hội nghị (số lượng bài nộp, tỷ lệ chấp nhận, tóm tắt đánh giá)',
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị', example: 'conf-2026-001' })
  @ApiResponse({ status: 200, description: 'Báo cáo tổng quan hội nghị' })
  @ApiUnauthorizedResponse({ description: 'Không được phép - thiếu hoặc token không hợp lệ' })
  @ApiForbiddenResponse({ description: 'Không có quyền - thiếu quyền truy cập' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getOverview(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') userId: number,
  ) {
    this.logRequest(userId, conferenceId, 'tổng quan');
    return this.reportsService.getOverview(conferenceId);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Thống kê chi tiết bài nộp
  // ──────────────────────────────────────────────────────────────────────────────
  @Get('conference/:id/submissions-stats')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Thống kê chi tiết bài nộp (theo trạng thái, chủ đề/track nếu có)',
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiResponse({ status: 200, description: 'Thống kê bài nộp' })
  @ApiUnauthorizedResponse({ description: 'Không được phép' })
  @ApiForbiddenResponse({ description: 'Không có quyền' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getSubmissionStats(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') userId: number,
  ) {
    this.logRequest(userId, conferenceId, 'thống kê bài nộp');
    return this.reportsService.getSubmissionStats(conferenceId);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Thống kê người đánh giá
  // ──────────────────────────────────────────────────────────────────────────────
  @Get('conference/:id/reviewers-stats')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Thống kê hiệu suất người đánh giá (số lượng review, điểm trung bình, tính kịp thời)',
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiResponse({ status: 200, description: 'Thống kê người đánh giá' })
  @ApiUnauthorizedResponse({ description: 'Không được phép' })
  @ApiForbiddenResponse({ description: 'Không có quyền' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getReviewerStats(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') userId: number,
  ) {
    this.logRequest(userId, conferenceId, 'thống kê người đánh giá');
    return this.reportsService.getReviewerStats(conferenceId);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Báo cáo SLA đánh giá
  // ──────────────────────────────────────────────────────────────────────────────
  @Get('conference/:id/review-sla')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Báo cáo tính kịp thời và tuân thủ SLA của quá trình đánh giá',
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiResponse({ status: 200, description: 'Báo cáo SLA đánh giá' })
  @ApiUnauthorizedResponse({ description: 'Không được phép' })
  @ApiForbiddenResponse({ description: 'Không có quyền' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getReviewSLA(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') userId: number,
  ) {
    this.logRequest(userId, conferenceId, 'SLA đánh giá');
    return this.reportsService.getReviewSLA(conferenceId);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Xuất proceedings (CSV / PDF)
  // ──────────────────────────────────────────────────────────────────────────────
  @Get('conference/:id/export-proceedings')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  @ApiOperation({
    summary: 'Xuất danh sách bài chấp nhận dưới dạng CSV hoặc PDF',
    description: 'Trả về file tải về. Mặc định: CSV',
  })
  @ApiParam({ name: 'id', description: 'ID hội nghị' })
  @ApiQuery({
    name: 'format',
    enum: ['csv', 'pdf'],
    required: false,
    description: 'Định dạng xuất file (mặc định: csv)',
  })
  @ApiProduces('text/csv', 'application/pdf')
  @ApiResponse({ status: 200, description: 'File tải về thành công' })
  @ApiBadRequestResponse({ description: 'Định dạng không hợp lệ hoặc không có bài chấp nhận' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy hội nghị hoặc không có dữ liệu' })
  @ApiForbiddenResponse({ description: 'Không có quyền - thiếu quyền truy cập' })
  @ApiUnauthorizedResponse({ description: 'Không được phép' })
  @ApiInternalServerErrorResponse({ description: 'Không thể tạo file xuất. Vui lòng thử lại sau' })
  async exportProceedings(
    @Param('id') conferenceId: string,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('userId') userId: number,
  ) {
    this.logRequest(userId, conferenceId, 'xuất proceedings', `(định dạng: ${format})`);

    const today = new Date().toISOString().split('T')[0];
    const safeConferenceId = conferenceId.replace(/[^a-zA-Z0-9-]/g, '_');
    const baseFilename = `proceedings_${safeConferenceId}_${today}`;

    try {
      if (format === 'pdf') {
        const pdfBuffer = await this.reportsService.exportProceedingsPdf(conferenceId);

        res
          .header({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${baseFilename}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
          })
          .send(pdfBuffer);
      } else if (format === 'csv') {
        const { filename, content } = await this.reportsService.exportProceedingsCsv(conferenceId);

        res
          .header({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename || baseFilename}.csv"`,
            'Content-Length': Buffer.byteLength(content, 'utf-8').toString(),
          })
          .send(content);
      } else {
        throw new BadRequestException('Chỉ hỗ trợ định dạng: csv, pdf');
      }
    } catch (error) {
      this.logger.error(
        `Xuất proceedings thất bại | hội nghị=${conferenceId} | user=${userId} | định dạng=${format}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Không thể tạo file xuất. Vui lòng thử lại sau.');
    }
  }
}