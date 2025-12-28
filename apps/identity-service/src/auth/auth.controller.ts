import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    const { message: _, ...rest } = result;
    return {
      message: 'Đăng ký tài khoản thành công',
      ...rest,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập và lấy JWT tokens' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không hợp lệ hoặc tài khoản chưa xác minh email' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      message: 'Đăng nhập thành công',
      ...result,
    };
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiResponse({ status: 200, description: 'Token được làm mới thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ hoặc đã hết hạn' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto);
    return {
      message: 'Làm mới access token thành công',
      ...result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đăng xuất và thu hồi refresh token' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  logout(
    @CurrentUser('sub') userId: number,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.logout(dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Xác minh email bằng mã 6 số' })
  @ApiResponse({ status: 200, description: 'Xác minh email thành công' })
  @ApiResponse({ status: 401, description: 'Mã không hợp lệ hoặc đã hết hạn' })
  async verifyEmail(@Body('token') code: string) {
    const result = await this.authService.verifyEmail(code);
    return result;
  }

  @Get('get-verification-token')
  @ApiOperation({ 
    summary: 'Lấy code từ db để xác thực',
    description: 'Helper endpoint để lấy verification token cho user để test.'
  })
  @ApiQuery({ name: 'email', description: 'Email của user cần lấy token', required: true, example: 'user@example.com' })
  @ApiResponse({ status: 200, description: 'Lấy token thành công' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async getVerificationToken(@Query('email') email: string) {
    const result = await this.authService.getVerificationTokenByEmail(email);
    
    if (result.isVerified) {
      return {
        message: result.message || 'Email đã được xác minh',
        data: result,
      };
    }
    
    return {
      message: 'Đã gửi mã kích hoạt tài khoản tới email (tồn tại)',
    };
  }
}

