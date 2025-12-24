// src/reports/reports.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../common/role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('conference/:id/overview')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async getOverview(@Param('id') conferenceId: string) {
    return this.reportsService.getOverview(conferenceId);
  }

  @Get('conference/:id/track-stats')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async getTrackStats(@Param('id') conferenceId: string) {
    return this.reportsService.getTrackStats(conferenceId);
  }

  @Get('conference/:id/institution-stats')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async getInstitutionStats(@Param('id') conferenceId: string) {
    return this.reportsService.getInstitutionStats(conferenceId);
  }

  @Get('conference/:id/review-sla')
  @Roles(RoleName.CHAIR, RoleName.ADMIN)
  async getReviewSLA(@Param('id') conferenceId: string) {
    return this.reportsService.getReviewSLA(conferenceId);
  }
}