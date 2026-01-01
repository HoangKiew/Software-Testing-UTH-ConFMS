import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { PcMembersModule } from '../pc-members/pc-members.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { SubmissionsClient } from '../integrations/submissions.client'; // ✅ import client

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    PcMembersModule,
    ConferencesModule,
    AuditModule,
    UsersModule,
  ],
  providers: [AssignmentsService, SubmissionsClient], // ✅ thêm vào providers
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
