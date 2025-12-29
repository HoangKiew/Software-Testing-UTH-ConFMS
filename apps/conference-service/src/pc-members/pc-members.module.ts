import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PcMember } from './entities/pc-member.entity';
import { PcMembersService } from './pc-members.service';
import { PcMembersController } from './pc-members.controller';
import { EmailsModule } from '../emails/emails.module';
import { ConferencesModule } from '../conferences/conferences.module';
import { AiModule } from '../ai/ai.module';
import { AuditModule } from '../audit/audit.module';
import { SubmissionsClient } from '../integrations/submissions.client';

// ✅ THÊM 2 IMPORT NÀY
import { UsersModule } from '../users/users.module';
import { UsersClient } from '../users/users.client';

// ✅ THÊM HttpModule (từ @nestjs/axios)
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([PcMember]),
    EmailsModule,
    ConferencesModule,
    AiModule,
    AuditModule,
    UsersModule,           // Đã có
    HttpModule,            // ✅ THÊM DÒNG NÀY – QUAN TRỌNG NHẤT!
  ],
  providers: [
    PcMembersService,
    SubmissionsClient,
    UsersClient,           // Đã có
  ],
  controllers: [PcMembersController],
  exports: [PcMembersService],
})
export class PcMembersModule {}