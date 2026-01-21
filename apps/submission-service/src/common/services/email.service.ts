import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = Number(this.configService.get<string>('SMTP_PORT')) || 587;
    const smtpUser = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD') || this.configService.get<string>('EMAIL_PASS');
    const smtpFrom = this.configService.get<string>('SMTP_FROM') || smtpUser;

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPassword ? {
        user: smtpUser,
        pass: smtpPassword,
      } : undefined,
    });
  }

  /**
   * Gửi email thông báo khi bài nộp được chấp nhận
   */
  async sendSubmissionAcceptedEmail(
    email: string,
    authorName: string,
    submissionTitle: string,
    conferenceName: string,
    decisionNote?: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl = this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') ||
            this.configService.get<string>('SMTP_USER') ||
            this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: `[${appName}] 🎉 Bài nộp của bạn đã được chấp nhận`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #059669;
            }
            .success-badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1> Chúc mừng!</h1>
              <p>Bài nộp của bạn đã được chấp nhận</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${authorName}</strong>,</p>
              <p>Chúng tôi vui mừng thông báo rằng bài nộp của bạn đã được chấp nhận!</p>
              
              <div class="info-box">
                <div class="success-badge">ĐÃ CHẤP NHẬN</div>
                <div class="info-item">
                  <span class="info-label">Hội nghị:</span> ${conferenceName}
                </div>
                <div class="info-item">
                  <span class="info-label">Tiêu đề bài nộp:</span> ${submissionTitle}
                </div>
                ${decisionNote ? `
                <div class="info-item">
                  <span class="info-label">Ghi chú từ ban tổ chức:</span><br>
                  ${decisionNote.replace(/\n/g, '<br>')}
                </div>
                ` : ''}
              </div>

              <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và thực hiện các bước tiếp theo (nếu có).</p>
              <p>Trân trọng,<br>Đội ngũ ${appName}</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời email này.</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Chúc mừng! Bài nộp của bạn đã được chấp nhận

Xin chào ${authorName},

Chúng tôi vui mừng thông báo rằng bài nộp của bạn đã được chấp nhận!

Hội nghị: ${conferenceName}
Tiêu đề bài nộp: ${submissionTitle}
${decisionNote ? `\nGhi chú từ ban tổ chức:\n${decisionNote}\n` : ''}

Vui lòng đăng nhập vào hệ thống để xem chi tiết và thực hiện các bước tiếp theo (nếu có).


Trân trọng,
Đội ngũ ${appName}
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Gửi email thông báo khi bài nộp bị từ chối
   */
  async sendSubmissionRejectedEmail(
    email: string,
    authorName: string,
    submissionTitle: string,
    conferenceName: string,
    decisionNote?: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl = this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') ||
            this.configService.get<string>('SMTP_USER') ||
            this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: `[${appName}] Thông báo về bài nộp của bạn`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              border: 2px solid #ef4444;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #dc2626;
            }
            .rejected-badge {
              display: inline-block;
              background: #ef4444;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: #ef4444;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thông báo về bài nộp</h1>
              <p>Kết quả đánh giá</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${authorName}</strong>,</p>
              <p>Chúng tôi rất tiếc thông báo rằng bài nộp của bạn chưa được chấp nhận trong đợt này.</p>
              
              <div class="info-box">
                <div class="rejected-badge">ĐÃ TỪ CHỐI</div>
                <div class="info-item">
                  <span class="info-label">Hội nghị:</span> ${conferenceName}
                </div>
                <div class="info-item">
                  <span class="info-label">Tiêu đề bài nộp:</span> ${submissionTitle}
                </div>
                ${decisionNote ? `
                <div class="info-item">
                  <span class="info-label">Ghi chú từ ban tổ chức:</span><br>
                  ${decisionNote.replace(/\n/g, '<br>')}
                </div>
                ` : ''}
              </div>

              <p>Chúng tôi cảm ơn bạn đã tham gia và mong được gặp lại bạn trong các hội nghị tiếp theo.</p>
              

              <p>Trân trọng,<br>Đội ngũ ${appName}</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời email này.</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Thông báo về bài nộp - Kết quả đánh giá

Xin chào ${authorName},

Chúng tôi rất tiếc thông báo rằng bài nộp của bạn chưa được chấp nhận trong đợt này.

Hội nghị: ${conferenceName}
Tiêu đề bài nộp: ${submissionTitle}
${decisionNote ? `\nGhi chú từ ban tổ chức:\n${decisionNote}\n` : ''}

Chúng tôi cảm ơn bạn đã tham gia và mong được gặp lại bạn trong các hội nghị tiếp theo.


Trân trọng,
Đội ngũ ${appName}
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Test email connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email connection verified successfully.');
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }
}
