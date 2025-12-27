// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Submission } from '../submissions/entities/submission.entity';
import { Conference } from '../conferences/entities/conference.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReviewsClient } from '../reviews/reviews.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Conference]),
    HttpModule, // Cho ReviewsClient dùng HttpService
  ],
  providers: [ReportsService, ReviewsClient],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}