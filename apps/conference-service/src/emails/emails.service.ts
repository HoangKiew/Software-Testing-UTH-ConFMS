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
    // Template 1: Mời reviewer
    this.templates['reviewer-invitation'] = handlebars.compile(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Lời mời tham gia phản biện</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Roboto,Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;border-collapse:collapse;border-spacing:0;background-color:#f5f5f5;">
          <tr>
            <td align="center" style="padding:24px 8px;">
              <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;border-spacing:0;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(60,64,67,0.2);">
                <tr>
                  <td style="background-color:#1a73e8;color:#ffffff;padding:16px 24px;">
                    <h2 style="margin:0;font-size:20px;font-weight:500;">UTH-ConfMS · Lời mời tham gia phản biện</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 24px 16px 24px;color:#202124;font-size:14px;line-height:1.6;">
                    <p style="margin:0 0 12px 0;">Xin chào <strong>{{name}}</strong>,</p>
                    <p style="margin:0 0 12px 0;">
                      Bạn đã được mời tham gia làm <strong>Reviewer</strong> cho hội nghị:
                    </p>
                    <p style="margin:12px 0;font-size:18px;font-weight:600;color:#0f9d58;text-align:center;">
                      {{conferenceName}}
                    </p>
                    <p style="margin:0 0 12px 0;">
                      Vai trò của bạn là đánh giá các bài báo khoa học phù hợp với chuyên môn. 
                      Chúng tôi rất mong nhận được sự đồng hành từ bạn!
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 24px 24px 24px;">
                    <table role="presentation" style="border-collapse:collapse;border-spacing:0;">
                      <tr>
                        <td align="center" style="padding:8px;">
                          <a href="{{acceptLink}}"
                             style="display:inline-block;background-color:#0f9d58;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:4px;font-size:14px;font-weight:500;">
                            Chấp nhận lời mời
                          </a>
                        </td>
                        <td align="center" style="padding:8px;">
                          <a href="{{declineLink}}"
                             style="display:inline-block;background-color:#d93025;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:4px;font-size:14px;font-weight:500;">
                            Từ chối lời mời
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 24px 24px;color:#5f6368;font-size:12px;line-height:1.5;">
                    <p style="margin:0 0 8px 0;">
                      Nếu bạn chấp nhận, hệ thống sẽ kích hoạt quyền Reviewer và Chair sẽ phân công bài báo phù hợp cho bạn.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e0e0e0;padding:16px 24px;color:#9aa0a6;font-size:11px;text-align:center;line-height:1.5;">
                    <p style="margin:0;">
                      Email này được gửi tự động từ hệ thống <strong>UTH-ConfMS</strong>.<br/>
                      ID lời mời: <strong>{{invitationId}}</strong> &nbsp;|&nbsp; Hội nghị ID: {{conferenceId}}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `);

    // Template 2: Thông báo quyết định bài nộp
    this.templates['decision_notification'] = handlebars.compile(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Thông báo kết quả bài nộp</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Roboto,Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;border-collapse:collapse;border-spacing:0;background-color:#f5f5f5;">
          <tr>
            <td align="center" style="padding:24px 8px;">
              <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;border-spacing:0;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(60,64,67,0.2);">
                <tr>
                  <td style="background-color:#1a73e8;color:#ffffff;padding:16px 24px;">
                    <h2 style="margin:0;font-size:20px;font-weight:500;">UTH-ConfMS · Thông báo kết quả bài nộp</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 24px 12px 24px;color:#202124;font-size:14px;line-height:1.6;">
                    <p style="margin:0 0 12px 0;">Xin chào quý tác giả,</p>
                    <p style="margin:0 0 12px 0;">Bài báo của bạn với tiêu đề:</p>
                    <p style="margin:12px 0;font-size:18px;font-weight:600;color:#0f9d58;text-align:center;">
                      {{submissionTitle}}
                    </p>
                    <p style="margin:0 0 12px 0;">Đã được Hội đồng Chương trình đưa ra quyết định cuối cùng:</p>
                    <p style="margin:12px 0;font-size:22px;font-weight:700;text-align:center;color:{{decisionColor}};">
                      {{decision}}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px 24px;color:#202124;font-size:14px;line-height:1.6;">
                    <p style="margin:0 0 8px 0;">Phản hồi từ Chair:</p>
                    <blockquote style="margin:0;border-left:4px solid #e0e0e0;padding-left:12px;font-style:italic;color:#5f6368;">
                      {{feedback}}
                    </blockquote>
                  </td>
                </tr>
                {{#if isAccepted}}
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <div style="background-color:#e8f5e9;border-radius:4px;padding:12px 14px;color:#1e8e3e;font-size:13px;line-height:1.5;">
                      <strong>Chúc mừng!</strong> Vui lòng chuẩn bị và upload bản camera-ready theo hướng dẫn trên hệ thống trong thời gian quy định.
                    </div>
                  </td>
                </tr>
                {{/if}}
                {{#if isRevision}}
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <div style="background-color:#fff3cd;border-radius:4px;padding:12px 14px;color:#8a6d3b;font-size:13px;line-height:1.5;">
                      Vui lòng chỉnh sửa bài báo theo phản hồi và nộp lại phiên bản mới.
                    </div>
                  </td>
                </tr>
                {{/if}}
                <tr>
                  <td style="padding:0 24px 24px 24px;color:#5f6368;font-size:13px;line-height:1.6;">
                    <p style="margin:0;">Cảm ơn bạn đã đóng góp bài báo cho hội nghị!</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e0e0e0;padding:16px 24px;color:#9aa0a6;font-size:11px;text-align:center;line-height:1.5;">
                    <p style="margin:0;">
                      Email này được gửi tự động từ hệ thống <strong>UTH-ConfMS</strong>.<br/>
                      Hội nghị: <strong>{{conferenceName}}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `);

    // Template 3: Thông báo phân công reviewer cho topic
    this.templates['reviewer-assignment'] = handlebars.compile(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Thông báo phân công phản biện</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Roboto,Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;border-collapse:collapse;border-spacing:0;background-color:#f5f5f5;">
          <tr>
            <td align="center" style="padding:24px 8px;">
              <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;border-spacing:0;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(60,64,67,0.2);">
                <tr>
                  <td style="background-color:#1a73e8;color:#ffffff;padding:16px 24px;">
                    <h2 style="margin:0;font-size:20px;font-weight:500;">UTH-ConfMS · Phân công phản biện</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 24px 16px 24px;color:#202124;font-size:14px;line-height:1.6;">
                    <p style="margin:0 0 12px 0;">Xin chào <strong>{{name}}</strong>,</p>
                    <p style="margin:0 0 12px 0;">
                      Bạn vừa được phân công làm <strong>Reviewer</strong> cho hội nghị:
                    </p>
                    <p style="margin:12px 0;font-size:18px;font-weight:600;color:#0f9d58;text-align:center;">
                      {{conferenceName}}
                    </p>
                    <p style="margin:0 0 8px 0;">Topic bạn được phân công:</p>
                    <p style="margin:8px 0 16px 0;font-size:16px;font-weight:600;text-align:center;color:#202124;">
                      {{topic}}
                    </p>
                    <p style="margin:0 0 12px 0;">
                      Vui lòng đăng nhập vào hệ thống để xem chi tiết bài báo sẽ được giao cho bạn trong topic này.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 24px 24px;color:#5f6368;font-size:13px;line-height:1.6;">
                    <p style="margin:0;">
                      Nếu có bất kỳ khó khăn nào trong quá trình phản biện, vui lòng liên hệ Chair của hội nghị để được hỗ trợ.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e0e0e0;padding:16px 24px;color:#9aa0a6;font-size:11px;text-align:center;line-height:1.5;">
                    <p style="margin:0;">
                      Email này được gửi tự động từ hệ thống <strong>UTH-ConfMS</strong>.<br/>
                      Vui lòng không trả lời trực tiếp email này.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
   * Gửi email thông báo phân công reviewer cho topic
   */
  async sendReviewerAssignmentEmail(
    toEmail: string,
    data: { name: string; conferenceName: string; topic: string },
  ) {
    return this.send('reviewer-assignment', [toEmail], {
      ...data,
      subject: `[${data.conferenceName}] Bạn được phân công phản biện topic "${data.topic}"`,
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