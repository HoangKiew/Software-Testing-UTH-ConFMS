// src/assignments/assignments.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignReviewersDto } from './dto/assign-reviewers.dto';
import { SuggestReviewersDto } from './dto/suggest-reviewers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../common/role.enum';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('conference/:id')
  @Roles(RoleName.CHAIR)
  async findAllByConference(@Param('id') conferenceId: string, @CurrentUser('userId') chairId: number) {
    return this.assignmentsService.findAllByConference(conferenceId, chairId);
  }

    // src/assignments/assignments.controller.ts
    @Get('suggest/:submissionId')
    @Roles(RoleName.CHAIR)
    async suggest(
    @Param('submissionId') submissionId: string,
    @Body() dto?: Partial<SuggestReviewersDto>, // Dùng Partial để optional hoàn toàn
    ) {
    const top = dto?.top ?? 5; // Nếu không gửi body hoặc không có top → dùng 5
    return this.assignmentsService.suggestReviewers(submissionId, top);
    }

  @Post('assign')
  @Roles(RoleName.CHAIR)
  async assign(@Body() dto: AssignReviewersDto, @CurrentUser('userId') chairId: number) {
    return this.assignmentsService.assignReviewers(dto, chairId);
  }

  @Delete(':id')
  @Roles(RoleName.CHAIR)
  async unassign(@Param('id') id: string, @CurrentUser('userId') chairId: number) {
    return this.assignmentsService.unassign(id, chairId);
  }
}