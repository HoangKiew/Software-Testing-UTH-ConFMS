import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Assignment } from './entities/assignment.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';

import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module'; // Nếu có thì giữ, không thì bỏ
import { SubmissionsClient } from '../integrations/submissions.client';

// THÊM DÒNG NÀY
import { AiModule } from '../ai/ai.module';  // Đường dẫn đến AiModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    ConferencesModule,
    AuditModule,
    UsersModule, // Nếu không tồn tại thì xóa dòng này
    HttpModule,
    AiModule, // ← THÊM DÒNG NÀY ĐỂ NEST BIẾT AiService Ở ĐÂU
  ],
  providers: [AssignmentsService, SubmissionsClient],
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule { }