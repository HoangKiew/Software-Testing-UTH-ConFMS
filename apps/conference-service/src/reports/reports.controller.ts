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

// ← THÊM 2 IMPORT CHO SWAGGER
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')              // Nhóm endpoint đẹp trong Swagger
@ApiBearerAuth('JWT-auth')       // ← QUAN TRỌNG: Bắt Swagger tự động thêm token
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ===== OVERVIEW =====
  @Get('conference/:id/overview')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async getOverview(@Param('id') conferenceId: string) {
    return this.reportsService.getOverview(conferenceId);
  }

  // ===== TRACK STATS =====
  @Get('conference/:id/track-stats')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async getTrackStats(@Param('id') conferenceId: string) {
    return this.reportsService.getTrackStats(conferenceId);
  }

  // ===== INSTITUTION STATS =====
  @Get('conference/:id/institution-stats')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async getInstitutionStats(@Param('id') conferenceId: string) {
    return this.reportsService.getInstitutionStats(conferenceId);
  }

  // ===== REVIEW SLA =====
  @Get('conference/:id/review-sla')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async getReviewSLA(@Param('id') conferenceId: string) {
    return this.reportsService.getReviewSLA(conferenceId);
  }

  // ===== EXPORT PROCEEDINGS (CSV / PDF) =====
  @Get('conference/:id/proceedings')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async exportProceedings(
    @Param('id') conferenceId: string,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response,
  ) {
    if (format === 'pdf') {
      const buffer =
        await this.reportsService.exportProceedingsPdf(conferenceId);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proceedings_${conferenceId}.pdf"`,
      });
      return res.send(buffer);
    }

    const csv =
      await this.reportsService.exportProceedingsCsv(conferenceId);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${csv.filename}"`,
    });
    return res.send(csv.data);
  }
}