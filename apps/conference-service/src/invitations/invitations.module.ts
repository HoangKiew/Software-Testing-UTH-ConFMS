// apps/conference-service/src/invitations/invitations.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Invitation } from './entities/invitation.entity';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsInternalController } from './invitations.internal.controller';

import { EmailsModule } from '../emails/emails.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { UsersModule } from '../users/users.module';
import { UsersClient } from '../users/users.client';
import { AuditModule } from '../audit/audit.module'; // Đã import đúng

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation]),
    EmailsModule,
    ConferencesModule,
    UsersModule,
    HttpModule,
    AuditModule, // Cung cấp AuditService cho InvitationsService
  ],
  providers: [
    InvitationsService,
    UsersClient,
  ],
  controllers: [
    InvitationsController,
    InvitationsInternalController,
  ],
  exports: [InvitationsService],
})
export class InvitationsModule { }