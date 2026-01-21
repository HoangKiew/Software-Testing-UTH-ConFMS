import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  isVerified: boolean;
}

@Injectable()
export class IdentityClientService {
  private readonly identityServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const isDocker = process.env.DOCKER_ENV === 'true' ||
                     process.env.IDENTITY_SERVICE_URL?.includes('identity-service');

    this.identityServiceUrl =
      this.configService.get<string>('IDENTITY_SERVICE_URL') ||
      (isDocker
        ? 'http://identity-service:3001/api'
        : 'http://localhost:3001/api');
  }

  // Lấy thông tin user theo ID
  async getUserById(userId: number, authToken: string): Promise<UserInfo | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.identityServiceUrl}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );

      const userInfo = response.data?.data || response.data || null;
      return userInfo;
    } catch (error: any) {
      const status = error.response?.status;

      if (status === HttpStatus.NOT_FOUND) {
        return null;
      }

      const isConnectionError = !status || 
                                error.code === 'ECONNREFUSED' || 
                                error.code === 'ETIMEDOUT' ||
                                error.code === 'ENOTFOUND';

      if (isConnectionError || status === HttpStatus.BAD_GATEWAY) {
        return null;
      }

      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        return null;
      }

      return null;
    }
  }

  // Lấy email của user theo ID
  async getUserEmail(userId: number, authToken: string): Promise<string | null> {
    const userInfo = await this.getUserById(userId, authToken);
    return userInfo?.email || null;
  }

  // Lấy tên đầy đủ của user theo ID
  async getUserFullName(userId: number, authToken: string): Promise<string | null> {
    const userInfo = await this.getUserById(userId, authToken);
    return userInfo?.fullName || null;
  }
}
