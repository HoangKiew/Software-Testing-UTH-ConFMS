import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface UserInfo {
  id: number;
  email: string;
  fullName?: string;
  roles?: string[];
}

@Injectable()
export class IdentityClientService {
  private readonly identityServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // Check if running in Docker
    const isDocker =
      process.env.DOCKER_ENV === 'true' ||
      process.env.IDENTITY_SERVICE_URL?.includes('identity-service');

    this.identityServiceUrl =
      this.configService.get<string>('IDENTITY_SERVICE_URL') ||
      (isDocker
        ? 'http://identity-service:3001/api'
        : 'http://localhost:3001/api');
    this.httpService.axiosRef.defaults.baseURL = this.identityServiceUrl;
    this.httpService.axiosRef.defaults.timeout = 10000;
  }

  /**
   * Get user information by ID
   */
  async getUserById(
    userId: number,
    authToken?: string,
  ): Promise<UserInfo | null> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await firstValueFrom(
        this.httpService.get(`/users/${userId}`, { headers }),
      );

      const userData = response.data?.data;
      if (!userData) {
        return null;
      }

      return {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        roles: userData.roles || [],
      };
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy thông tin user';

      if (!status || status >= 500) {
        return null;
      }

      if (status === HttpStatus.NOT_FOUND) {
        return null;
      }
      if (
        status === HttpStatus.UNAUTHORIZED ||
        status === HttpStatus.FORBIDDEN
      ) {
        return null;
      }
      return null;
    }
  }

  /**
   * Get multiple users by IDs (batch)
   */
  async getUsersByIds(
    userIds: number[],
    authToken?: string,
  ): Promise<Map<number, UserInfo>> {
    const userMap = new Map<number, UserInfo>();

    // Fetch users in parallel
    const promises = userIds.map(async (userId) => {
      try {
        const user = await this.getUserById(userId, authToken);
        if (user) {
          userMap.set(userId, user);
        }
      } catch (error) {
        throw new HttpException(
          `Lỗi khi lấy thông tin user với ID ${userId}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
        }
    });

    await Promise.all(promises);
    return userMap;
  }
}
