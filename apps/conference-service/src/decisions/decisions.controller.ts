// apps/conference-service/src/decisions/decisions.controller.ts

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { MakeDecisionDto } from './dto/make-decision.dto';
import { BulkDecisionDto } from './dto/bulk-decision.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

// ← THÊM 2 IMPORT CHO SWAGGER
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Decisions')            // Nhóm endpoint trong Swagger
@ApiBearerAuth('JWT-auth')       // ← QUAN TRỌNG: Bắt Swagger tự động thêm token
@Controller('decisions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Get('conference/:id/summary')
  @Roles(RoleName.CHAIR)
  async getSummary(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.decisionsService.getSummaryForConference(conferenceId, chairId);
  }

  @Post('single')
  @Roles(RoleName.CHAIR)
  async makeDecision(
    @Body() dto: MakeDecisionDto,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.decisionsService.makeDecision(dto, chairId);
  }

  @Post('bulk')
  @Roles(RoleName.CHAIR)
  async makeBulkDecisions(
    @Body() dto: BulkDecisionDto,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.decisionsService.makeBulkDecisions(dto, chairId);
  }

  @Post('conference/:id/make-all')
  @Roles(RoleName.CHAIR)
  async makeAllDecisions(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.decisionsService.makeAllDecisions(conferenceId, chairId);
  }
}