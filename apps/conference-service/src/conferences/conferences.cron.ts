// apps/conference-service/src/conferences/conferences.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConferencesService } from './conferences.service';
import { ConferenceStatus } from './entities/conference.entity';

@Injectable()
export class ConferencesCron {
  private readonly logger = new Logger(ConferencesCron.name);

  constructor(private readonly conferencesService: ConferencesService) {}

  // Chạy mỗi ngày lúc 00:05 sáng
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // Hoặc test nhanh: @Cron('*/30 * * * * *') // mỗi 30 giây
  async handleDeadlineChecks() {
    this.logger.log('Bắt đầu kiểm tra deadlines của các hội nghị...');

    const conferences = await this.conferencesService.findAll();

    const now = new Date();

    for (const conf of conferences) {
      const { deadlines, status } = conf;

      // Kiểm tra deadline nộp bài
      if (
        status === ConferenceStatus.OPEN_FOR_SUBMISSION &&
        deadlines &&
        deadlines.submission &&
        now > new Date(deadlines.submission)
      ) {
        await this.conferencesService.updateStatus(
          conf.id,
          ConferenceStatus.SUBMISSION_CLOSED,
          conf.chairId,
        );
        this.logger.log(
          `Hội nghị "${conf.name}" tự động chuyển sang SUBMISSION_CLOSED`,
        );
      }

      // Có thể thêm các điều kiện khác sau:
      // Ví dụ: UNDER_REVIEW → REVIEW_COMPLETED khi hết deadline review
    }

    this.logger.log('Kiểm tra deadlines hoàn tất.');
  }
}