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
      this.logger.warn(
        'SMTP config missing (SMTP_HOST, SMTP_USER, SMTP_PASS) – email sending will be skipped and logged to console',
      );
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // Sử dụng SSL nếu port 465
        auth: { user, pass },
        debug: this.configService.get('NODE_ENV') !== 'production',
        logger: this.configService.get('NODE_ENV') !== 'production',
      });
    }

    // Đăng ký các template
    this.registerTemplates();
  }

  private registerTemplates() {
    // Template mời reviewer (mới - đẹp, responsive)
    this.registerTemplate('reviewer-invitation', `
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

    // Các template cũ giữ nguyên (invite-pc-member, submission-received, decision-notification)
    this.registerTemplate('invite-pc-member', `...`); // Giữ nguyên nếu còn dùng
    this.registerTemplate('submission-received', `...`);
    this.registerTemplate('decision-notification', `...`);
  }

  private registerTemplate(name: string, source: string) {
    this.templates.set(name, handlebars.compile(source));
  }

  /**
   * Gửi email mời reviewer (dùng template reviewer-invitation)
   * @param toEmail Email người nhận
   * @param data Dữ liệu template: name, conferenceName, acceptLink, declineLink, invitationId, conferenceId
   */
  async sendReviewerInvitationEmail(toEmail: string, data: {
    name: string;
    conferenceName: string;
    acceptLink: string;
    declineLink: string;
    invitationId: string;
    conferenceId?: string;
  }) {
    return this.send('reviewer-invitation', [toEmail], {
      ...data,
      subject: `[${data.conferenceName}] Lời mời tham gia phản biện`,
    });
  }

  /**
   * Gửi email chung (sử dụng template đã đăng ký)
   * @param templateName Tên template
   * @param to Danh sách email người nhận
   * @param data Dữ liệu cho handlebars + subject (nếu không có thì mặc định)
   */
  async send(templateName: string, to: string[], data: any) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new BadRequestException(`Template không tồn tại: ${templateName}`);
    }

    const html = template(data);
    const subject = data.subject || 'UTH-ConfMS Notification';

    // Dev mode: log thay vì gửi
    if (!this.transporter) {
      this.logger.log(`[DEV MODE] Gửi email "${subject}" đến ${to.join(', ')}`);
      this.logger.log('Nội dung HTML:');
      this.logger.log(html);
      return { status: 'logged' };
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'no-reply@uth-confms.vn',
        to: to.join(', '),
        subject,
        html,
      });
      this.logger.log(`Email "${subject}" gửi thành công đến ${to.join(', ')}`);
    } catch (error) {
      this.logger.error(`Lỗi gửi email "${subject}": ${error.message}`);
      throw new BadRequestException('Lỗi gửi email, vui lòng thử lại sau');
    }
  }
}