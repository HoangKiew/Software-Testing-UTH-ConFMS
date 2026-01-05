import { Controller, Get, Param } from '@nestjs/common';
import { SubmissionServiceService } from '../submission-service.service';

@Controller('internal')
export class InternalController {
  constructor(private readonly submissionService: SubmissionServiceService) {}

  // Public internal endpoint for other services to fetch the latest public file URL
  @Get('submissions/:id/file')
  async getSubmissionFile(@Param('id') id: string) {
    const sid = parseInt(id, 10);
    if (Number.isNaN(sid)) {
      return { status: 'error', message: 'Invalid submission id' };
    }

    return this.submissionService.getPublicFileInfoBySubmissionId(sid);
  }
}
