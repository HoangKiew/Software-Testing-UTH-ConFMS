// src/users/users.client.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersClient {
  private readonly logger = new Logger(UsersClient.name);
  private baseUrl: string;

  constructor(
    private config: ConfigService,
    private http: HttpService,
  ) {
    this.baseUrl = this.config.get<string>('IDENTITY_SERVICE_URL') || 'http://localhost:3003/api';
  }

  // Lấy email của user theo userId
  async getUserEmail(userId: number): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<{ email: string }>(`${this.baseUrl}/users/${userId}/email`),
      );
      return data.email || 'unknown@author.example.com';
    } catch (error: any) {
      this.logger.warn(`Không thể lấy email user ${userId}: ${error.message}`);
      return 'unknown@author.example.com'; // fallback an toàn
    }
  }

  // Lấy thông tin user (email + fullName)
  async getUser(userId: number): Promise<{ email: string; fullName?: string }> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<{ email: string; fullName?: string }>(`${this.baseUrl}/users/${userId}`),
      );
      return data;
    } catch (error: any) {
      this.logger.error(`Lỗi lấy thông tin user ${userId}:`, error.message);
      return { email: 'unknown@author.example.com' };
    }
  }

  // === MỚI: Thêm role cho user (gọi từ conference-service khi accept invitation) ===
  async addRole(userId: number, role: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(
          `${this.baseUrl}/users/${userId}/roles`,
          { role }, // body: { role: "REVIEWER" }
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
      this.logger.log(`Đã thêm role ${role} cho user ${userId}`);
    } catch (error: any) {
      this.logger.error(
        `Không thể thêm role ${role} cho user ${userId}:`,
        error.response?.data || error.message,
      );
      // Không throw lỗi ra ngoài → tránh làm hỏng flow accept invitation
      // Có thể xử lý sau bằng retry queue hoặc admin manual
    }
  }
}