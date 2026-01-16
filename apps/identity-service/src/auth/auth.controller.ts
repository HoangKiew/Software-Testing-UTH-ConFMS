import { Body, Controller, Get, Post, Query, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
// Đăng ký tài admin
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    const { message: _, ...rest } = result;
    return {
      message: 'Đăng ký tài khoản thành công',
      user: rest.user,
    };
  }
// Đăng nhập 
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập và lấy JWT tokens' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không hợp lệ hoặc tài khoản chưa xác minh email' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      message: 'Đăng nhập thành công',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }
// refresh token
  @Post('refresh-token')
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiResponse({ status: 200, description: 'Token được làm mới thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ hoặc đã hết hạn' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto);
    return {
      message: 'Làm mới access token thành công',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }
// Đăng xuất
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
// Api 2: Xác minh email
  @Post('verify-email')
  @ApiOperation({ summary: 'Xác minh email bằng mã 6 số' })
  @ApiResponse({ status: 200, description: 'Xác minh email thành công' })
  @ApiResponse({ status: 400, description: 'Tài khoản đã được xác minh rồi' })
  @ApiResponse({ status: 401, description: 'Mã không hợp lệ hoặc đã hết hạn' })
  async verifyEmail(@Body('token') code: string) {
    const result = await this.authService.verifyEmail(code);
    return result;
  }
// Lấy verification code
  @Get('get-verification-token')
  @ApiOperation({ 
    summary: 'Lấy code từ db để xác thực',
    description: 'Helper endpoint để lấy verification token cho user để test.'
  })
  @ApiQuery({ name: 'email', description: 'Email của user cần lấy token', required: true, example: 'user@example.com' })
  @ApiResponse({ status: 200, description: 'Lấy token thành công' })
  @ApiResponse({ status: 400, description: 'Email đã được xác minh rồi' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async getVerificationToken(@Query('email') email: string) {
    const result = await this.authService.getVerificationTokenByEmail(email);
    
    return {
      message: 'Đã gửi mã kích hoạt tài khoản tới email (tồn tại)',
    };
  }

  // Endpoint /me as alias for /users/profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin profile của user hiện tại (alias cho /users/profile)' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getMe(@CurrentUser('sub') userId: number) {
    try {
      if (!userId || typeof userId !== 'number') {
        throw new UnauthorizedException('Token không hợp lệ hoặc thiếu thông tin người dùng');
      }
      
      const user = await this.usersService.getProfile(userId);
      if (!user) {
        throw new NotFoundException('Không tìm thấy thông tin người dùng');
      }
      
      const { password, roles, ...rest } = user;
      return {
        message: 'Lấy thông tin người dùng thành công',
        user: {
          ...rest,
          roles: roles?.map((role) => role.name) || [],
        },
      };
    } catch (error: any) {
      // Re-throw known exceptions
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      // Log and throw generic error for unknown errors
      console.error('[AuthController] Error in getMe:', error);
      throw new UnauthorizedException('Lỗi khi lấy thông tin người dùng: ' + (error?.message || 'Unknown error'));
    }
  }
}

