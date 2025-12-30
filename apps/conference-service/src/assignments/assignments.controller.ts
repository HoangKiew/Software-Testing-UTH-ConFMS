// apps/conference-service/src/assignments/assignments.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query, // ← THÊM Query để lấy top từ ?top=
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignReviewersDto } from './dto/assign-reviewers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

// ← THÊM 2 IMPORT CHO SWAGGER
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Assignments')          // Nhóm endpoint trong Swagger
@ApiBearerAuth('JWT-auth')      // ← QUAN TRỌNG: Bắt Swagger tự động gán token
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('conference/:id')
  @Roles(RoleName.CHAIR)
  async findAllByConference(
    @Param('id') conferenceId: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.findAllByConference(conferenceId, chairId);
  }

  // === SỬA LẠI ENDPOINT GỢI Ý REVIEWER ===
  @Get('suggest/:submissionId')
  @Roles(RoleName.CHAIR)
  async suggest(
    @Param('submissionId') submissionId: string,
    @Query('top') topStr?: string, // ← Lấy top từ query parameter ?top=10
  ) {
    const top = topStr ? parseInt(topStr, 10) : 5;
    const limit = isNaN(top) || top <= 0 ? 5 : top;
    return this.assignmentsService.suggestReviewers(submissionId, limit);
  }

  @Post('assign')
  @Roles(RoleName.CHAIR)
  async assign(
    @Body() dto: AssignReviewersDto,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.assignReviewers(dto, chairId);
  }

  @Delete(':id')
  @Roles(RoleName.CHAIR)
  async unassign(
    @Param('id') id: string,
    @CurrentUser('userId') chairId: number,
  ) {
    return this.assignmentsService.unassign(id, chairId);
  }
}