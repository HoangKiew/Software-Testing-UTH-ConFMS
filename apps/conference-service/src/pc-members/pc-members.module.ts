// src/pc-members/pc-members.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PcMember } from './entities/pc-member.entity';
import { PcMembersService } from './pc-members.service';
import { PcMembersController } from './pc-members.controller';
import { EmailsModule } from '../emails/emails.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { AiModule } from '../ai/ai.module';
import { AuditModule } from '../audit/audit.module';
import { SubmissionsModule } from '../submissions/submissions.module';  // ← THÊM DÒNG NÀY

@Module({
  imports: [
    TypeOrmModule.forFeature([PcMember]),
    EmailsModule,
    ConferencesModule,
    AiModule,
    AuditModule,
    SubmissionsModule,  // ← THÊM DÒNG NÀY VÀO ĐÂY
  ],
  providers: [PcMembersService],
  controllers: [PcMembersController],
  exports: [PcMembersService],
})
export class PcMembersModule {}