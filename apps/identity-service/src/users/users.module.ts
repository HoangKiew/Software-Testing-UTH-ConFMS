import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { EmailService } from '../common/services/email.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { SeedService } from './seed.service'; // Đường dẫn đúng

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, Role, PasswordResetToken])],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard, SeedService, EmailService],
  exports: [UsersService],
})
export class UsersModule { }