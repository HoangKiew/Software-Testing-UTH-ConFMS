// apps/conference-service/src/emails/emails.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailsService } from './emails.service';

@Module({
  imports: [ConfigModule],  // Để load env vars từ ConfigService
  providers: [EmailsService],
  exports: [EmailsService],  // Export để các module khác (e.g., PcMembers, Decisions) dùng được
})
export class EmailsModule {}