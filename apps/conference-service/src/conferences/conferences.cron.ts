// apps/conference-service/src/conferences/conferences.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConferencesService } from './conferences.service';
import { ConferenceStatus } from './entities/conference.entity';

@Injectable()
export class ConferencesCron {
  private readonly logger = new Logger(ConferencesCron.name);

  constructor(private readonly conferencesService: ConferencesService) { }

  // Chạy mỗi ngày lúc 00:05 sáng
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDeadlineChecks() {
    this.logger.log('Bắt đầu kiểm tra deadlines của các hội nghị...');

    const conferences = await this.conferencesService.findAll();

    const now = new Date();

    for (const conf of conferences) {
      const deadlines = conf.deadlines;
      const status = conf.status;

      // Kiểm tra deadline nộp bài — chuyển từ OPEN → REVIEW khi quá hạn nộp
      if (
        status === ConferenceStatus.OPEN &&
        deadlines?.submission &&
        now > new Date(deadlines.submission)
      ) {
        // updateStatus method not yet implemented in ConferencesService
        // TODO: implement ConferencesService.updateStatus(id, status, userId)
        this.logger.warn(
          `Hội nghị "${conf.name}" (ID: ${conf.id}) đã hết hạn nộp bài và cần chuyển sang REVIEW. ` +
          `ConferencesService.updateStatus() chưa được implement.`,
        );
      }
    }

    this.logger.log('Kiểm tra deadlines hoàn tất.');
  }
}