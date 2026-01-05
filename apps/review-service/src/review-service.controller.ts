import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { CurrentUser } from './auth/current-user.decorator';
import { ReviewServiceService } from './review-service.service';

@Controller()
@ApiTags('ReviewService')
@ApiBearerAuth('JWT-auth')
export class ReviewServiceController {
  constructor(private readonly reviewService: ReviewServiceService) {}

  // 1. Route public – kiểm tra service sống
  @Get('health')
  @ApiOperation({ summary: 'Kiểm tra health của Review Service' })
  health() {
    return { 
      status: 'Review service is up',
      message: this.reviewService.getHello(),
      timestamp: new Date().toISOString()
    };
  }

  // 2. Route cần token – kiểm tra verify token thành công
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin profile của user đang đăng nhập (token required)' })
  getProfile(@CurrentUser() user: any) {
    return { 
      message: 'Bạn đã đăng nhập thành công vào Review Service!',
      user 
    };
  }

  // 3. Route chỉ dành cho reviewer – test phân quyền role 'reviewer'
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('REVIEWER')
  @Get('reviewer/dashboard')
  @ApiOperation({ summary: 'Dashboard cho Reviewer (role REVIEWER)' })
  reviewerDashboard(@CurrentUser('sub') userId: string) {
    return { 
      message: 'Chào mừng Reviewer! Đây là dashboard riêng của bạn.',
      userId,
      role: 'reviewer'
    };
  }

  // 4. Route chỉ dành cho chair/PC – test phân quyền role 'chair'
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CHAIR')
  @Get('pc/dashboard')
  @ApiOperation({ summary: 'Dashboard cho Chair / Program Committee (role CHAIR)' })
  pcDashboard(@CurrentUser('sub') userId: string) {
    return { 
      message: 'Chào mừng Program Committee (Chair)! Đây là dashboard quản lý.',
      userId,
      role: 'chair'
    };
  }
}