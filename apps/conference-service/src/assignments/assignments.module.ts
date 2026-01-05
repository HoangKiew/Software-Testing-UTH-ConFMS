import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';               // ← THÊM DÒNG NÀY
import { Assignment } from './entities/assignment.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { PcMembersModule } from '../pc-members/pc-members.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { SubmissionsClient } from '../integrations/submissions.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    PcMembersModule,
    ConferencesModule,
    AuditModule,
    UsersModule,
    HttpModule,                                        // ← THÊM DÒNG NÀY VÀO ĐÂY
  ],
  providers: [AssignmentsService, SubmissionsClient],
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}