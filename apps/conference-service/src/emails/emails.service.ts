// apps/conference-service/src/emails/emails.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

interface EmailTemplateData {
  [key: string]: any;
  subject?: string;
}

@Injectable()
export class EmailsService {
  private transporter: nodemailer.Transporter | null = null;
  private templates: Record<string, handlebars.TemplateDelegate> = {};
  private logger = new Logger(EmailsService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP config missing (SMTP_HOST, SMTP_USER, SMTP_PASS) – email sending will be logged only (dev mode)',
      );
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        debug: this.configService.get('NODE_ENV') !== 'production',
        logger: this.configService.get('NODE_ENV') !== 'production',
      });

      this.logger.log(`SMTP transporter initialized successfully (host: ${host}, port: ${port})`);
    }

    this.registerTemplates();
  }

  private registerTemplates() {
    // ──────────────────────────────────────────────────────────────────────────────
    // Template 1: Mời reviewer (giữ nguyên)
    // ──────────────────────────────────────────────────────────────────────────────
    this.templates['reviewer-invitation'] = handlebars.compile(`
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #1a73e8; text-align: center;">Lời mời tham gia phản biện</h2>
        
        <p>Xin chào <strong>{{name}}</strong>,</p>
        
        <p>Bạn đã được mời tham gia làm <strong>Reviewer</strong> cho hội nghị:</p>
        <h3 style="color: #0f9d58; text-align: center;">{{conferenceName}}</h3>
        
        <p>Vai trò của bạn sẽ là đánh giá các bài báo khoa học phù hợp với chuyên môn. Chúng tôi rất mong nhận được sự đồng hành từ bạn!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{acceptLink}}" 
             style="background-color: #0f9d58; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px; display: inline-block;">
            ✅ Chấp nhận lời mời
          </a>
          
          <a href="{{declineLink}}" 
             style="background-color: #d93025; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px; display: inline-block;">
            ❌ Từ chối lời mời
          </a>
        </div>
        
        <p>Nếu bạn chấp nhận, chúng tôi sẽ liên hệ để hướng dẫn tiếp theo và phân công bài báo phù hợp.</p>
        <p>Cảm ơn bạn đã dành thời gian và đóng góp cho cộng đồng khoa học!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Email này được gửi tự động từ hệ thống <strong>UTH ConfMS</strong>.<br>
          ID lời mời: <strong>{{invitationId}}</strong> | Hội nghị ID: {{conferenceId}}
        </p>
      </div>
    `);

    // ──────────────────────────────────────────────────────────────────────────────
    // Template 2: Thông báo quyết định bài nộp (mới thêm)
    // ──────────────────────────────────────────────────────────────────────────────
    this.templates['decision_notification'] = handlebars.compile(`
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #1a73e8; text-align: center;">Thông báo kết quả đánh giá bài nộp</h2>
        
        <p>Xin chào quý tác giả,</p>
        
        <p>Bài báo của bạn với tiêu đề:</p>
        <h3 style="color: #0f9d58; text-align: center; margin: 10px 0;">{{submissionTitle}}</h3>
        
        <p>Đã được Hội đồng Chương trình đưa ra quyết định cuối cùng:</p>
        <h3 style="text-align: center; font-size: 24px; margin: 20px 0; color: {{decisionColor}};">
          {{decision}}
        </h3>
        
        <p>Phản hồi từ Chair:</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 15px; margin: 15px 0; font-style: italic; color: #444;">
          {{feedback}}
        </blockquote>
        
        {{#if isAccepted}}
        <p style="background-color: #e8f5e9; padding: 15px; border-radius: 6px;">
          <strong>Chúc mừng!</strong> Vui lòng chuẩn bị và upload bản camera-ready theo hướng dẫn trên hệ thống trong thời gian quy định.
        </p>
        {{/if}}
        
        {{#if isRevision}}
        <p style="background-color: #fff3cd; padding: 15px; border-radius: 6px;">
          Vui lòng chỉnh sửa bài báo theo phản hồi và nộp lại phiên bản mới.
        </p>
        {{/if}}
        
        <p>Cảm ơn bạn đã đóng góp bài báo cho hội nghị!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Email này được gửi tự động từ hệ thống <strong>UTH-ConfMS</strong>.<br>
          Hội nghị: <strong>{{conferenceName}}</strong>
        </p>
      </div>
    `);
  }

  /**
   * Gửi email mời reviewer (dùng template reviewer-invitation)
   */
  async sendReviewerInvitationEmail(
    toEmail: string,
    data: {
      name: string;
      conferenceName: string;
      acceptLink: string;
      declineLink: string;
      invitationId: string;
      conferenceId?: string;
    },
  ) {
    return this.send('reviewer-invitation', [toEmail], {
      ...data,
      subject: `[${data.conferenceName}] Lời mời tham gia phản biện`,
    });
  }

  /**
   * Gửi email chung với retry (tối đa 3 lần)
   */
  async send(templateName: string, to: string[], data: EmailTemplateData & { subject?: string }) {
    const template = this.templates[templateName];
    if (!template) {
      throw new BadRequestException(`Template không tồn tại: ${templateName}`);
    }

    const html = template(data);
    const subject = data.subject || 'UTH-ConfMS Notification';

    // Dev mode: chỉ log nội dung (không gửi thật)
    if (!this.transporter) {
      this.logger.log(`[DEV MODE] Email "${subject}" đến ${to.join(', ')}`);
      this.logger.log('Nội dung HTML (cắt ngắn):');
      this.logger.log(html.substring(0, 500) + '...');
      return { status: 'logged' };
    }

    // Production: gửi thật với retry
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || 'no-reply@uth-confms.vn',
          to: to.join(', '),
          subject,
          html,
        });

        this.logger.log(`Email "${subject}" gửi thành công đến ${to.join(', ')} (lần ${attempts})`);
        return { status: 'sent', attempts };
      } catch (error: any) {
        this.logger.warn(`Lỗi gửi email "${subject}" lần ${attempts}/${maxAttempts}: ${error.message}`, error.stack);
        if (attempts === maxAttempts) {
          throw new BadRequestException(`Lỗi gửi email sau ${maxAttempts} lần thử: ${error.message}`);
        }
        // Delay 1s trước retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}