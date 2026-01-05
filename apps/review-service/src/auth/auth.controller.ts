import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Proxy login to Identity Service' })
  async login(@Body() dto: LoginDto) {
    const identityUrl = this.config.get<string>('IDENTITY_SERVICE_URL') || 'http://identity-service:3001';
    const url = `${identityUrl}/api/auth/login`;
    try {
      const response = await firstValueFrom(this.httpService.post(url, dto));
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status || 500;
      const data = err?.response?.data || { message: 'Identity service error' };
      return { statusCode: status, ...data };
    }
  }
}
