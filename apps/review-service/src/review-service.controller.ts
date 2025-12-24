import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { CurrentUser } from './auth/current-user.decorator';

@Controller()
export class ReviewServiceController {
  // Route public (không cần login)
  @Get('health')
  health() {
    return { status: 'Review service is up' };
  }

  // Route yêu cầu login (cả reviewer và PC)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return { message: 'Profile của bạn', user };
  }

  // Route chỉ cho reviewer (role 'reviewer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('reviewer')
  @Get('reviewer/dashboard')
  reviewerDashboard(@CurrentUser('sub') userId: string) {
    return { message: 'Dashboard dành cho reviewer', userId };
  }

  // Route chỉ cho PC (role 'chair' - giả sử PC là CHAIR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('chair')
  @Get('pc/dashboard')
  pcDashboard(@CurrentUser('sub') userId: string) {
    return { message: 'Dashboard dành cho PC (Program Committee)', userId };
  }
}