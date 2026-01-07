import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReviewerService } from './reviewer.service';

class ExternalAssignmentDto {
  submissionId: string;
  reviewerId: number;
  conferenceId?: string;
  assignedBy?: string;
  deadline?: string; // ISO date
  acceptDeadline?: string; // ISO date
  reviewDeadline?: string; // ISO date
}

@ApiTags('Internal')
@Controller('api/internal')
export class ReviewerInternalController {
  constructor(private readonly svc: ReviewerService) {}

  @Post('assignments')
  @ApiOperation({ summary: 'Receive assignment from conference-service (internal)' })
  async receiveAssignment(@Body() dto: ExternalAssignmentDto) {
    return this.svc.createAssignmentFromExternal(dto as any);
  }
}
