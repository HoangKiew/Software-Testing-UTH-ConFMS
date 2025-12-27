// src/users/users.client.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersClient {
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
        this.http.get<{ email: string }>(`${this.baseUrl}/users/${userId}`),
      );
      return data.email;
    } catch (error) {
      console.error(`Không thể lấy email user ${userId}:`, error.message);
      return 'unknown@author.example.com'; // fallback an toàn
    }
  }

  // Có thể mở rộng: lấy full info user nếu cần
  async getUser(userId: number): Promise<{ email: string; fullName?: string }> {
    const { data } = await firstValueFrom(
      this.http.get<{ email: string; fullName?: string }>(`${this.baseUrl}/users/${userId}`),
    );
    return data;
  }
}