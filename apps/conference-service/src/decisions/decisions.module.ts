// src/decisions/decisions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Decision } from './entities/decision.entity';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller';
import { SubmissionsModule } from '../submissions/submissions.module';
import { EmailsModule } from '../emails/emails.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module';
import { ReviewsClient } from '../reviews/reviews.client';
import { UsersClient } from '../users/users.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([Decision]),
    forwardRef(() => SubmissionsModule),
    EmailsModule,
    ConferencesModule,
    AuditModule,
    HttpModule,
  ],
  providers: [DecisionsService, ReviewsClient, UsersClient],
  controllers: [DecisionsController],
  exports: [DecisionsService],
})
export class DecisionsModule {}