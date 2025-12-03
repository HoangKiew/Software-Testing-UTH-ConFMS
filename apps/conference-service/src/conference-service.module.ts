import { Module } from '@nestjs/common';
import { ConferenceServiceController } from './conference-service.controller';
import { ConferenceServiceService } from './conference-service.service';

@Module({
  imports: [],
  controllers: [ConferenceServiceController],
  providers: [ConferenceServiceService],
})
export class ConferenceServiceModule {}
