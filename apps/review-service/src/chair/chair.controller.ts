import { Body, Controller, Get, Param, Post, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChairService } from './chair.service';
import { DecisionDto } from './dto/decision.dto';

@ApiTags('Chair')
@ApiBearerAuth('JWT-auth')
@Controller('chair')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CHAIR')
export class ChairController {
  constructor(private readonly svc: ChairService) {}

  @Get('submissions/:submissionId/summary')
  async getSummary(@Param('submissionId') submissionId: string) {
    return this.svc.getSubmissionSummary(submissionId);
  }

  @Get('submissions/:submissionId/decision')
  async getDecision(@Param('submissionId') submissionId: string) {
    return this.svc.getDecision(submissionId);
  }

  @Post('submissions/:submissionId/decision')
  async postDecision(
    @Param('submissionId') submissionId: string,
    @Body() dto: DecisionDto,
    @CurrentUser('sub') chairId: number,
  ) {
    return this.svc.upsertDecision(submissionId, chairId, dto as any);
  }

  @Patch('submissions/:submissionId/decision')
  async patchDecision(
    @Param('submissionId') submissionId: string,
    @Body() dto: DecisionDto,
    @CurrentUser('sub') chairId: number,
  ) {
    return this.svc.upsertDecision(submissionId, chairId, dto as any);
  }

  @Delete('submissions/:submissionId/decision')
  async deleteDecision(@Param('submissionId') submissionId: string) {
    return this.svc.removeDecision(submissionId);
  }
}
