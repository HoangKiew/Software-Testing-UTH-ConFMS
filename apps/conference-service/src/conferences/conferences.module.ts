import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConferencesController } from './conferences.controller';
import { ConferencesService } from './conferences.service';
import { Conference } from './entities/conference.entity';
import { Track } from './entities/track.entity';
import { ConferenceMember } from './entities/conference-member.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [TypeOrmModule.forFeature([Conference, Track, ConferenceMember])],
  controllers: [ConferencesController],
  providers: [
    ConferencesService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [ConferencesService],
})
export class ConferencesModule {}

