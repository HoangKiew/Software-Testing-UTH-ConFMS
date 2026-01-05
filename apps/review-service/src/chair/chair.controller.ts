import { Body, Controller, Get, Param, Post, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Lấy tóm tắt submission (thông tin để quyết định)' })
  async getSummary(@Param('submissionId') submissionId: string) {
    return this.svc.getSubmissionSummary(submissionId);
  }

  @Get('submissions/:submissionId/decision')
  @ApiOperation({ summary: 'Lấy quyết định hiện tại cho submission' })
  async getDecision(@Param('submissionId') submissionId: string) {
    return this.svc.getDecision(submissionId);
  }

  @Get('decisions/accepted')
  @ApiOperation({ summary: 'Danh sách submission đã được chair này chấp nhận' })
  async listAccepted(@CurrentUser('sub') chairId: number) {
    return this.svc.listDecisionsByChair(chairId, 'accepted');
  }

  @Get('decisions/rejected')
  @ApiOperation({ summary: 'Danh sách submission đã bị chair này từ chối' })
  async listRejected(@CurrentUser('sub') chairId: number) {
    return this.svc.listDecisionsByChair(chairId, 'rejected');
  }

  @Get('decisions/pending')
  @ApiOperation({ summary: 'Danh sách submission cần chair quyết định (có final reviews nhưng chưa có quyết định của chair)' })
  async listPending(@CurrentUser('sub') chairId: number) {
    return this.svc.listPendingDecisions(chairId);
  }

  @Post('submissions/:submissionId/decision')
  @ApiOperation({ summary: 'Tạo hoặc cập nhật quyết định cho submission (POST/UPSERT)' })
  async postDecision(
    @Param('submissionId') submissionId: string,
    @Body() dto: DecisionDto,
    @CurrentUser('sub') chairId: number,
  ) {
    return this.svc.upsertDecision(submissionId, chairId, dto as any);
  }

  @Patch('submissions/:submissionId/decision')
  @ApiOperation({ summary: 'Cập nhật quyết định cho submission (PATCH/UPSERT)' })
  async patchDecision(
    @Param('submissionId') submissionId: string,
    @Body() dto: DecisionDto,
    @CurrentUser('sub') chairId: number,
  ) {
    return this.svc.upsertDecision(submissionId, chairId, dto as any);
  }

  @Delete('submissions/:submissionId/decision')
  @ApiOperation({ summary: 'Xóa quyết định cho submission' })
  async deleteDecision(@Param('submissionId') submissionId: string) {
    return this.svc.removeDecision(submissionId);
  }
}
