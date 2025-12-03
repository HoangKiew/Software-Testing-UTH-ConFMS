import { Controller, Get } from '@nestjs/common';
import { SubmissionServiceService } from './submission-service.service';

@Controller()
export class SubmissionServiceController {
  constructor(private readonly submissionServiceService: SubmissionServiceService) {}

  @Get()
  getHello(): string {
    return this.submissionServiceService.getHello();
  }
}
