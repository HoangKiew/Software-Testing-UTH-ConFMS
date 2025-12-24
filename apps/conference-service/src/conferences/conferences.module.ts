// src/conferences/conferences.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conference } from './entities/conference.entity';
import { Submission } from '../submissions/entities/submission.entity'; // Thêm
import { ConferencesController } from './conferences.controller';
import { ConferencesService } from './conferences.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conference, Submission]), // Thêm Submission
  ],
  controllers: [ConferencesController],
  providers: [ConferencesService],
  exports: [ConferencesService],
})
export class ConferencesModule {}