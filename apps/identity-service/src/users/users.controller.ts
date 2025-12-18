import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleName } from './entities/role.entity';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
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
    return { message: 'Khởi tạo quy trình reset mật khẩu' };
  }

  @Post('reset-password')
  async resetPassword(
    @Body('email') email: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.usersService.resetPassword(email, newPassword);
    return { message: 'Reset mật khẩu thành công' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @Post('create')
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
  async updateUserRoles(
    @Param('id', ParseIntPipe) userId: number,
    @Body('roles') roles: string[],
  ) {
    const user = await this.usersService.updateUserRoles(userId, roles);
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'Cập nhật vai trò người dùng thành công',
      user: userWithoutPassword,
    };
  }
}
