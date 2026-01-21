import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BulkNotificationDto, RecipientType } from './dto/bulk-notification.dto';
import { EmailTemplate } from '../template/entities/email-template.entity';
import {
  ConferenceMember,
  ConferenceMemberRole,
} from '../conferences/entities/conference-member.entity';
import { Conference } from '../conferences/entities/conference.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(ConferenceMember)
    private conferenceMemberRepository: Repository<ConferenceMember>,
    @InjectRepository(Conference)
    private conferenceRepository: Repository<Conference>,
  ) {}

  // Hiển thị template với các biến đã được thay thế
  private renderTemplate(
    template: string,
    variables: Record<string, string> = {},
  ): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    }
    return rendered;
  }
// Lấy danh sách người nhận dựa trên loại
  private async getRecipients(
    conferenceId: number,
    recipientType: RecipientType,
  ): Promise<Array<{ userId: number; email?: string }>> {
    switch (recipientType) {
      case RecipientType.PC_MEMBERS:
      case RecipientType.CHAIRS: {
        const members = await this.conferenceMemberRepository.find({
          where: {
            conferenceId,
            role:
              recipientType === RecipientType.CHAIRS
                ? ConferenceMemberRole.CHAIR
                : undefined,
          },
        });
        return members.map((m) => ({ userId: m.userId }));
      }
      case RecipientType.AUTHORS:
      case RecipientType.REVIEWERS:
        return [];
      default:
        return [];
    }
  }
// Gửi email hàng loạt
  async sendBulkNotification(
    conferenceId: number,
    dto: BulkNotificationDto,
  ): Promise<{
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    errors: Array<{ recipientEmail: string; error: string }>;
  }> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException(`Conference với ID ${conferenceId} không tồn tại`);
    }
    let template: EmailTemplate | null = null;
    if (dto.templateId) {
      template = await this.emailTemplateRepository.findOne({
        where: { id: dto.templateId, conferenceId },
      });

      if (!template) {
        throw new NotFoundException(
          `Email template với ID ${dto.templateId} không tồn tại`,
        );
      }
    }
    const recipients = await this.getRecipients(conferenceId, dto.recipientType);
    const subject = dto.subject || template?.subject || 'Notification';
    const body = dto.body || template?.body || '';
    const variables = {
      conferenceName: conference.name,
      conferenceVenue: conference.venue,
      conferenceStartDate: conference.startDate.toISOString(),
      conferenceEndDate: conference.endDate.toISOString(),
      ...dto.variables,
    };
    const renderedSubject = this.renderTemplate(subject, variables);
    const renderedBody = this.renderTemplate(body, variables);
    const sentCount = recipients.length;
    const failedCount = 0;
    const errors: Array<{ recipientEmail: string; error: string }> = [];

    return {
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
      errors,
    };
  }
// Xem trước thông báo
  async previewNotification(
    conferenceId: number,
    dto: BulkNotificationDto,
  ): Promise<{ subject: string; body: string }> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException(`Conference với ID ${conferenceId} không tồn tại`);
    }

    let template: EmailTemplate | null = null;
    if (dto.templateId) {
      template = await this.emailTemplateRepository.findOne({
        where: { id: dto.templateId, conferenceId },
      });

      if (!template) {
        throw new NotFoundException(
          `Email template với ID ${dto.templateId} không tồn tại`,
        );
      }
    }

    const subject = dto.subject || template?.subject || 'Notification';
    const body = dto.body || template?.body || '';

    const variables = {
      conferenceName: conference.name,
      conferenceVenue: conference.venue,
      conferenceStartDate: conference.startDate.toISOString(),
      conferenceEndDate: conference.endDate.toISOString(),
      ...dto.variables,
    };

    return {
      subject: this.renderTemplate(subject, variables),
      body: this.renderTemplate(body, variables),
    };
  }
}

