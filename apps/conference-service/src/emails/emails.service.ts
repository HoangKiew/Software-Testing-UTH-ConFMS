// apps/conference-service/src/emails/emails.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

@Injectable()
export class EmailsService {
  private transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      console.warn('SMTP config missing – email sending will be skipped in development');
      // Không throw error để có thể chạy local mà không cần SMTP
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }

    // Đăng ký tất cả template email cần thiết
    this.registerTemplate('cfp-announcement', `
      <h1>Call for Papers: {{conferenceName}}</h1>
      <p>Kính gửi các nhà nghiên cứu,</p>
      <p>Chúng tôi trân trọng mời quý vị nộp bài cho hội nghị <strong>{{conferenceName}}</strong> ({{acronym}}).</p>
      <p>Deadline nộp bài: <strong>{{submissionDeadline}}</strong></p>
      <p>Các chủ đề quan tâm: {{topics}}</p>
      <p><a href="{{cfpUrl}}" style="background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Nộp bài tại đây</a></p>
      <p>Trân trọng,<br>Ban tổ chức</p>
    `);

    this.registerTemplate('invite-pc-member', `
      <h1>Lời mời tham gia Program Committee</h1>
      <p>Kính gửi <strong>{{fullName}}</strong>,</p>
      <p>Chúng tôi trân trọng mời quý vị tham gia <strong>{{role}}</strong> cho hội nghị khoa học <strong>{{conferenceName}}</strong> ({{acronym}}).</p>
      <p>Thông tin hội nghị:</p>
      <ul>
        <li>Thời gian: {{startDate}} đến {{endDate}}</li>
        <li>Deadline nộp bài: {{submissionDeadline}}</li>
        <li>Chủ đề chính: {{topics}}</li>
      </ul>
      <p>Vui lòng đăng nhập vào hệ thống UTH-ConfMS để chấp nhận lời mời:</p>
      <p style="text-align:center;">
        <a href="http://localhost:3002" style="background:#28a745;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;">Đăng nhập & Chấp nhận lời mời</a>
      </p>
      <p>Nếu quý vị cần thêm thông tin, vui lòng liên hệ ban tổ chức.</p>
      <p>Trân trọng,<br>Ban tổ chức {{conferenceName}}</p>
    `);

    this.registerTemplate('decision-notification', `
      <h2>Thông báo quyết định bài nộp: {{title}}</h2>
      <p>Kính gửi tác giả,</p>
      <p>Bài báo của quý vị đã được <strong>{{decision}}</strong>.</p>
      {{#if feedback}}
      <h3>Nhận xét từ reviewer:</h3>
      <div style="background:#f8f9fa;padding:15px;border-left:4px solid #007bff;">
        <p>{{feedback}}</p>
      </div>
      {{/if}}
      {{#if isAccepted}}
      <p>Xin chúc mừng! Vui lòng nộp bản camera-ready trước ngày <strong>{{cameraReadyDeadline}}</strong>.</p>
      {{/if}}
      <p>Trân trọng,<br>Ban tổ chức hội nghị</p>
    `);

    // Template thêm: thông báo phân công reviewer (tùy chọn)
    this.registerTemplate('assignment-notification', `
      <h2>Phân công đánh giá bài báo</h2>
      <p>Kính gửi <strong>{{fullName}}</strong>,</p>
      <p>Quý vị được phân công đánh giá bài báo:</p>
      <ul>
        <li><strong>Tiêu đề:</strong> {{title}}</li>
        <li><strong>Tác giả:</strong> {{authors}}</li>
        <li><strong>Tóm tắt:</strong> {{abstract}}</li>
      </ul>
      <p>Vui lòng hoàn thành đánh giá trước deadline.</p>
      <p><a href="http://localhost:3002" style="background:#ffc107;color:black;padding:12px 24px;text-decoration:none;border-radius:6px;">Đi đến hệ thống đánh giá</a></p>
      <p>Cảm ơn sự đóng góp của quý vị!</p>
    `);
  }

  private registerTemplate(name: string, source: string) {
    this.templates.set(name, handlebars.compile(source));
  }

  async send(templateName: string, to: string[], data: any) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new BadRequestException(`Template not found: ${templateName}`);
    }

    const html = template(data);

    // Nếu không có SMTP config (dev mode), chỉ log ra console
    if (!this.transporter) {
      console.log(`[EMAIL DEV MODE] Sending "${data.subject || 'No subject'}" to ${to.join(', ')}`);
      console.log('HTML content:');
      console.log(html);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM') || 'no-reply@uth-confms.vn',
      to: to.join(', '),
      subject: data.subject || 'UTH-ConfMS Notification',
      html,
    });
  }
}