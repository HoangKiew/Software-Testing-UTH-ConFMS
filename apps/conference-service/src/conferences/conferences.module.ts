// apps/conference-service/src/conferences/conferences.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conference } from './entities/conference.entity';
import { ConferenceMember } from './entities/conference-member.entity';
import { Track } from './entities/track.entity';
import { ConferencesController } from './conferences.controller';
import { ConferencesService } from './conferences.service';
import { ConferencesCron } from './conferences.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conference, ConferenceMember, Track]),
  ],
  controllers: [ConferencesController],
  providers: [ConferencesService, ConferencesCron],
  exports: [ConferencesService],
})
export class ConferencesModule { }