import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleName } from './entities/role.entity';
import * as bcrypt from 'bcrypt';
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
    const user = await this.usersService.getProfile(userId);
    const { password, ...rest } = user;
    return {
      message: 'Lấy thông tin người dùng thành công',
      user: rest,
    };
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
  async forgotPassword(@Body('email') email: string) {
    await this.usersService.forgotPassword(email);
    return { message: 'Đã gửi mã reset mật khẩu tới email (nếu tồn tại)' };
  }

  @Post('reset-password')
  async resetPassword(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.usersService.resetPassword(email, code, newPassword);
    return { message: 'Reset mật khẩu thành công' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @Post('create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo user mới với role tùy chỉnh (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tạo user thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  async createUser(@Body() dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUserWithRole({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      roleName: dto.role,
    });

    const userWithRoles = await this.usersService.findById(user.id);
    if (!userWithRoles) {
      throw new Error('Failed to create user');
    }

    const { password, ...userWithoutPassword } = userWithRoles;
    return {
      message: 'Tạo tài khoản thành công',
      user: userWithoutPassword,
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
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'Cập nhật vai trò người dùng thành công',
      user: userWithoutPassword,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Xóa user thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  @ApiResponse({ status: 404, description: 'User không tồn tại' })
  async deleteUser(@Param('id', ParseIntPipe) userId: number) {
    await this.usersService.deleteUser(userId);
    return { message: 'Xóa user thành công' };
  }
}

