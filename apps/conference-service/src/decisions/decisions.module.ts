// src/decisions/decisions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Decision } from './entities/decision.entity';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller'; // Đảm bảo file này tồn tại và export DecisionsController
import { EmailsModule } from '../emails/emails.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module';
import { ReviewsClient } from '../reviews/reviews.client';
import { UsersClient } from '../users/users.client';
import { SubmissionsClient } from '../integrations/submissions.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([Decision]),
    EmailsModule,
    ConferencesModule,
    AuditModule,
    HttpModule, // Dùng cho các client (reviews, submissions, users)
  ],
  providers: [
    DecisionsService,
    ReviewsClient,
    UsersClient,
    SubmissionsClient,
  ],
  controllers: [DecisionsController],
  exports: [DecisionsService], // Export service để module khác dùng nếu cần
})
export class DecisionsModule { }