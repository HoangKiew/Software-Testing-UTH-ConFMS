import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm'; // Thêm dòng này
import { HttpModule } from '@nestjs/axios'; // Thêm dòng này (để gọi submission-service)
import { ReviewServiceController } from './review-service.controller';
import { ReviewServiceService } from './review-service.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AuthModule } from './auth/auth.module';
import { Assignment } from './entities/assignment.entity'; // Thêm (sau khi tạo entity)
import { Review } from './entities/review.entity'; // Thêm
import { ReviewHistory } from './entities/review-history.entity'; // Thêm
import { DiscussionMessage } from './entities/discussion-message.entity'; // Thêm
import { ReviewerModule } from './reviewer/reviewer.module'; // Thêm sau khi tạo reviewer module
import { ChairModule } from './chair/chair.module';
import { Decision } from './entities/decision.entity'; // Thêm cái này

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/review-service/.env', '.env'],
    }),
    PassportModule,
    AuthModule,
    HttpModule, // Thêm
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET is required in environment variables');
        }
        return {
          secret,
          signOptions: {
            expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as any,
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({ // Thêm toàn bộ khối này
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: +(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [
          Assignment,
          Review,              // Thêm
          ReviewHistory,       // Thêm
          DiscussionMessage,   // Thêm
          Decision, // Thêm cái này
    ],
        synchronize: true,
        logging: true,
      }),
    }),
    ReviewerModule, // Thêm sau khi tạo
    ChairModule, // Thêm dòng này
  ],
  controllers: [ReviewServiceController],
  providers: [
    ReviewServiceService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class ReviewServiceModule {}