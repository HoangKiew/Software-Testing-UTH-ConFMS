import { Controller, Get } from '@nestjs/common';
import { ConferenceServiceService } from './conference-service.service';

@Controller()
export class ConferenceServiceController {
  constructor(private readonly conferenceServiceService: ConferenceServiceService) {}

  @Get()
  getHello(): string {
    return this.conferenceServiceService.getHello();
  }
}
