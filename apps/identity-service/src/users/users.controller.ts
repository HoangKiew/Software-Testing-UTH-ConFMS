import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards, Delete, Query, UnauthorizedException, NotFoundException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleName } from './entities/role.entity';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin profile của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getProfile(@CurrentUser('sub') userId: number) {
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
      console.error('[UsersController] Error in getProfile:', error);
      throw new UnauthorizedException('Lỗi khi lấy thông tin người dùng: ' + (error?.message || 'Unknown error'));
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu cũ không đúng' })
  async changePassword(
    @CurrentUser('sub') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { message: 'Đổi mật khẩu thành công' };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Gửi mã reset mật khẩu qua email' })
  @ApiResponse({ status: 200, description: 'Đã gửi mã reset mật khẩu (luôn trả về 200 để bảo mật)' })
  async forgotPassword(@Body('email') email: string) {
    await this.usersService.forgotPassword(email);
    return { message: 'Đã gửi mã reset mật khẩu tới email (nếu tồn tại)' };
  }

  @Get('get-reset-code')
  @ApiOperation({ 
    summary: 'Lấy code db để xác thực email',
    description: 'Helper endpoint để lấy reset code cho user để test.'
  })
  @ApiQuery({ name: 'email', description: 'Email của user cần lấy code', required: true })
  @ApiResponse({ status: 200, description: 'Lấy code thành công' })
  @ApiResponse({ status: 404, description: 'User không tồn tại hoặc chưa có code' })
  async getResetCode(@Query('email') email: string) {
    const result = await this.usersService.getResetCodeByEmail(email);
    return {
      message: 'Lấy reset code thành công',
      data: result,
    };
  }

  @Post('verify-reset-code')
  @ApiOperation({ summary: 'Xác minh mã reset mật khẩu' })
  @ApiResponse({ status: 200, description: 'Mã hợp lệ' })
  @ApiResponse({ status: 400, description: 'Mã không hợp lệ hoặc đã hết hạn' })
  async verifyResetCode(
    @Body('email') email: string,
    @Body('code') code: string,
  ) {
    const isValid = await this.usersService.verifyResetCode(email, code);
    if (!isValid) {
      throw new UnauthorizedException('Mã reset mật khẩu không hợp lệ hoặc đã hết hạn');
    }
    return { message: 'Mã reset mật khẩu hợp lệ', valid: true };
  }

  @Post('reset-password')
  @ApiOperation({
      summary: "Đặt lại password",
      description: "Đặt lại password khi quên pass"
  })
  async resetPassword(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.usersService.resetPassword(email, code, newPassword);
    return { message: 'Reset mật khẩu thành công' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.CHAIR)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách tất cả users (Admin/Chair only)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN hoặc CHAIR' })
  async getAllUsers() {
    const users = await this.usersService.findAll();
    const usersWithoutPassword = users.map(({ password, roles, ...user }) => ({
      ...user,
      roles: roles?.map((role) => role.name) || [],
    }));
    return {
      message: 'Lấy danh sách người dùng thành công',
      data: usersWithoutPassword,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin user theo ID (Authenticated users)' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async getUserById(@Param('id', ParseIntPipe) userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    const { password, roles, ...userWithoutPassword } = user;
    return {
      message: 'Lấy thông tin người dùng thành công',
      data: {
        ...userWithoutPassword,
        roles: roles?.map((role) => role.name) || [],
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @Post('create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo user mới với role tùy chỉnh (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo user thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  async createUser(@Body() dto: CreateUserDto) {
    // Truyền password gốc để service có thể gửi trong email, service sẽ tự hash
    const user = await this.usersService.createUserWithRole({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      roleName: dto.role,
    });

    const userWithRoles = await this.usersService.findById(user.id);
    if (!userWithRoles) {
      throw new Error('Failed to create user');
    }

    const { password, roles, ...userWithoutPassword } = userWithRoles;
    return {
      message: 'Tạo tài khoản thành công. Email thông báo đã được gửi đến người dùng.',
      data: {
        ...userWithoutPassword,
        roles: roles?.map((role) => role.name) || [],
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @Patch(':id/roles')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật role cho user (Admin thực hiện)' })
  @ApiResponse({ status: 200, description: 'Cập nhật role thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  async updateUserRoles(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserRolesDto,
  ) {
    const user = await this.usersService.updateUserRoles(userId, dto.role);
    const { password, roles, ...userWithoutPassword } = user;
    return {
      message: 'Cập nhật vai trò người dùng thành công',
      data: {
        ...userWithoutPassword,
        roles: roles?.map((role) => role.name) || [],
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa user (Admin only) - Soft Delete với Guard Clauses' })
  @ApiResponse({ status: 200, description: 'Xóa user thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa user (có submissions/reviews)' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async deleteUser(
    @Param('id', ParseIntPipe) userId: number,
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    await this.usersService.deleteUser(userId, authToken);
    return { message: 'Xóa user thành công (soft delete)' };
  }
}

