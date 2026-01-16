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
   * Gửi email reset password code
   */
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl = this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 
            this.configService.get<string>('SMTP_USER') || 
            this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: `[${appName}] Mã xác nhận đặt lại mật khẩu`,
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
              background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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
            .code-box {
              background: white;
              border: 2px solid #14b8a6;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #14b8a6;
              letter-spacing: 5px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>Đặt lại mật khẩu</p>
            </div>
            <div class="content">
              <p>Xin chào,</p>
              <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng sử dụng mã xác nhận sau:</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Mã xác nhận của bạn:</p>
                <div class="code">${code}</div>
              </div>

              <div class="warning">
                <strong> Lưu ý:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Mã này chỉ có hiệu lực trong <strong>15 phút</strong></li>
                  <li>Không chia sẻ mã này với bất kỳ ai</li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                </ul>
              </div>

              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              
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
${appName} - Đặt lại mật khẩu

Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng sử dụng mã xác nhận sau:

Mã xác nhận: ${code}

⚠️ Lưu ý:
- Mã này chỉ có hiệu lực trong 15 phút
- Không chia sẻ mã này với bất kỳ ai
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này

Trân trọng,
Đội ngũ ${appName}
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send password reset email to ${email}`);
    }
  }

  /**
   * Gửi email verification với mã 6 số
   */
  async sendVerificationEmail(email: string, code: string, fullName?: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 
            this.configService.get<string>('SMTP_USER') || 
            this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: `[${appName}] Mã xác minh email của bạn`,
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
              background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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
            .code-box {
              background: white;
              border: 2px solid #14b8a6;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #14b8a6;
              letter-spacing: 5px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>Xác minh email</p>
            </div>
            <div class="content">
              <p>Xin chào ${fullName || 'bạn'},</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại ${appName}. Vui lòng sử dụng mã xác minh sau:</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Mã xác minh của bạn:</p>
                <div class="code">${code}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Lưu ý:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Mã này chỉ có hiệu lực trong <strong>15 phút</strong></li>
                  <li>Không chia sẻ mã này với bất kỳ ai</li>
                  <li>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này</li>
                </ul>
              </div>

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
${appName} - Xác minh email

Xin chào ${fullName || 'bạn'},

Cảm ơn bạn đã đăng ký tài khoản tại ${appName}. Vui lòng sử dụng mã xác minh sau:

Mã xác minh: ${code}

⚠️ Lưu ý:
- Mã này chỉ có hiệu lực trong 15 phút
- Không chia sẻ mã này với bất kỳ ai
- Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này

Trân trọng,
Đội ngũ ${appName}
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send verification email to ${email}`);
    }
  }

  /**
   * Gửi email thông báo tài khoản đã được tạo bởi admin
   */
  async sendAccountCreatedNotification(email: string, fullName: string, password: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl = this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 
            this.configService.get<string>('SMTP_USER') || 
            this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: `[${appName}] Tài khoản của bạn đã được tạo`,
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
              background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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
              border: 2px solid #14b8a6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #f3f4f6;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #14b8a6;
              display: inline-block;
              min-width: 120px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #14b8a6;
              color: white;
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
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>Tài khoản của bạn đã được tạo</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${fullName}</strong>,</p>
              <p>Tài khoản của bạn đã được tạo thành công trên hệ thống ${appName}. Dưới đây là thông tin đăng nhập của bạn:</p>
              
              <div class="info-box">
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span>${email}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Mật khẩu:</span>
                  <span>${password}</span>
                </div>
              </div>

              <div class="warning">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên để bảo mật tài khoản</li>
                  <li>Không chia sẻ thông tin đăng nhập với bất kỳ ai</li>
                  <li>Nếu bạn không yêu cầu tạo tài khoản này, vui lòng liên hệ với quản trị viên</li>
                </ul>
              </div>

              <p style="text-align: center;">
                <a href="${appUrl}/login" class="button">Đăng nhập ngay</a>
              </p>

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
${appName} - Tài khoản của bạn đã được tạo

Xin chào ${fullName},

Tài khoản của bạn đã được tạo thành công trên hệ thống ${appName}. Dưới đây là thông tin đăng nhập của bạn:

Email: ${email}
Mật khẩu: ${password}

⚠️ Lưu ý quan trọng:
- Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên để bảo mật tài khoản
- Không chia sẻ thông tin đăng nhập với bất kỳ ai
- Nếu bạn không yêu cầu tạo tài khoản này, vui lòng liên hệ với quản trị viên

Đăng nhập tại: ${appUrl}/login

Trân trọng,
Đội ngũ ${appName}
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send account creation notification email to ${email}`);
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

