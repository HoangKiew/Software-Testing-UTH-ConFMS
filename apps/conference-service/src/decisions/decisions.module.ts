// src/decisions/decisions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Decision } from './entities/decision.entity';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller';
import { EmailsModule } from '../emails/emails.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module';
import { ReviewsClient } from '../reviews/reviews.client';
import { UsersClient } from '../users/users.client';
import { SubmissionsClient } from '../integrations/submissions.client'; // ✅ Added import

@Module({
  imports: [
    TypeOrmModule.forFeature([Decision]),
    EmailsModule,
    ConferencesModule,
    AuditModule,
    HttpModule,
  ],
  providers: [DecisionsService, ReviewsClient, UsersClient, SubmissionsClient], // ✅ Added SubmissionsClient
  controllers: [DecisionsController],
  exports: [DecisionsService],
})
export class DecisionsModule {}