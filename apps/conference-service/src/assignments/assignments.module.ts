// src/assignments/assignments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { PcMembersModule } from '../pc-members/pc-members.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module'; // ← THÊM DÒNG NÀY

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    PcMembersModule,
    forwardRef(() => SubmissionsModule), // Tránh circular
    ConferencesModule,
    AuditModule,
    UsersModule, // ← THÊM DÒNG NÀY VÀO ĐÂY
  ],
  providers: [AssignmentsService],
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}