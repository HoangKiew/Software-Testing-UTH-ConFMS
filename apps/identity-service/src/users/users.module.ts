import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, PasswordResetToken]),
  ],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard, EmailService],
  exports: [UsersService],
})
export class UsersModule {}
