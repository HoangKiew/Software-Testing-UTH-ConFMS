import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { EmailService } from '../common/services/email.service';
import { SubmissionClientService } from '../integrations/submission-client.service';
import { ReviewClientService } from '../integrations/review-client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, PasswordResetToken, EmailVerificationToken]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService, 
    RolesGuard, 
    EmailService,
    SubmissionClientService,
    ReviewClientService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
