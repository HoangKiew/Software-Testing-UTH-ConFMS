// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiAuditLog } from './ai-audit.entity';
import { ConferencesModule } from '../conferences/conferences.module';
import { AuditModule } from '../audit/audit.module'; // Thêm nếu muốn dùng AuditService thay vì repo trực tiếp

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AiAuditLog]),
    ConferencesModule,
    // AuditModule nếu dùng AuditService thay repo
  ],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}