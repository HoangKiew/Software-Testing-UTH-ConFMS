// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Conference } from '../conferences/entities/conference.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReviewsClient } from '../reviews/reviews.client';
import { SubmissionsClient } from '../integrations/submissions.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conference]),
    HttpModule, // cho ReviewsClient
  ],
  providers: [
    ReportsService,
    ReviewsClient,
    SubmissionsClient,
  ],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
