import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  @UseGuards(JwtAuthGuard)
  @Get('test')
  testAuth(@CurrentUser() user: any) {
    return { message: 'Auth test successful', user };
  }
}