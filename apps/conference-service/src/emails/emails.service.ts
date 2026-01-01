// apps/conference-service/src/emails/emails.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

@Injectable()
export class EmailsService {
  private transporter: nodemailer.Transporter | null = null;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private logger = new Logger(EmailsService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP config missing – email sending will be skipped and logged to console');
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,  // Sử dụng SSL nếu port 465
        auth: { user, pass },
        debug: this.configService.get('NODE_ENV') !== 'production',  // Debug mode cho dev
        logger: this.configService.get('NODE_ENV') !== 'production',
      });
    }

    // Register các template email (có thể thêm nhiều hơn ở đây)
    this.registerTemplates();
  }

  private registerTemplates() {
    // Template mời PC Member (ví dụ từ code cũ)
    this.registerTemplate('invite-pc-member', `
      <h2>Xin chào {{name}},</h2>
      <p>Bạn đã được mời tham gia Program Committee cho hội nghị "{{conferenceName}}".</p>
      <p>Vui lòng truy cập hệ thống để chấp nhận hoặc từ chối lời mời.</p>
      <a href="{{link}}" style="background-color:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Xem lời mời</a>
    `);

    // Template thông báo submission (ví dụ)
    this.registerTemplate('submission-received', `
      <h2>Cảm ơn {{authorName}},</h2>
      <p>Bài nộp của bạn cho hội nghị "{{conferenceName}}" đã được nhận.</p>
      <p>ID bài nộp: {{submissionId}}</p>
      <p>Trạng thái: Đang chờ review.</p>
    `);

    // Template mới: Thông báo decision (accept/reject)
    this.registerTemplate('decision-notification', `
      <h2>Kết quả bài nộp cho hội nghị "{{conferenceName}}"</h2>
      <p>Kính gửi {{authorName}},</p>
      <p>Bài nộp ID: {{submissionId}} của quý vị đã được đánh giá.</p>
      <p><strong>Quyết định: {{decision}}</strong></p>
      {{#if feedback}}
        <p>Phản hồi từ Chair: {{feedback}}</p>
      {{/if}}
      <p>Cảm ơn sự tham gia của quý vị!</p>
      <a href="{{link}}" style="background-color:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Xem chi tiết</a>
    `);

    // Thêm các template khác nếu cần (e.g., review-reminder, etc.)
  }

  private registerTemplate(name: string, source: string) {
    this.templates.set(name, handlebars.compile(source));
  }

  async send(templateName: string, to: string[], data: any) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new BadRequestException(`Template không tồn tại: ${templateName}`);
    }

    const html = template(data);
    const subject = data.subject || 'UTH-ConfMS Notification';

    // Dev mode: Log thay vì gửi thật
    if (!this.transporter) {
      this.logger.log(`[DEV MODE] Gửi email "${subject}" đến ${to.join(', ')}`);
      this.logger.log('Nội dung HTML:');
      this.logger.log(html);
      return { status: 'logged' };  // Trả về để biết dev mode
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'no-reply@uth-confms.vn',
        to: to.join(', '),
        subject,
        html,
        // Thêm attachment nếu cần: attachments: [{ filename: 'file.pdf', path: '/path/to/file' }]
      });
      this.logger.log(`Email "${subject}" gửi thành công đến ${to.join(', ')}`);
    } catch (error) {
      this.logger.error(`Lỗi gửi email "${subject}": ${error.message}`);
      throw new BadRequestException('Lỗi gửi email, vui lòng thử lại sau');
    }
  }
}