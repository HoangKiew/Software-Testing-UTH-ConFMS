import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm'; // Thêm dòng này
import { HttpModule } from '@nestjs/axios'; // Thêm dòng này (để gọi submission-service)
import { ReviewServiceController } from './review-service.controller';
import { PcMembersProxyController } from './pc-members/pc-members.proxy.controller';
// AuthController (login proxy) is intentionally not imported; review-service
// should accept access tokens issued by identity-service and not provide login.
import { ReviewServiceService } from './review-service.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AuthModule } from './auth/auth.module';
import { ReviewerModule } from './reviewer/reviewer.module';
import { ChairModule } from './chair/chair.module';
// Entities and sub-modules (reviewer/chair) will be added later.

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
        const publicKey = config.get<string>('IDENTITY_JWT_PUBLIC_KEY');
        const expiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
        return {
          secret: secret || publicKey || undefined,
          signOptions: secret ? { expiresIn: expiresIn as any } : undefined,
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: +(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        synchronize: true,
        logging: true,
        autoLoadEntities: true,
      }),
    }),
    // ReviewerModule (contains reviewer entities and controller)
    // will register entities via TypeOrmModule.forFeature
    ReviewerModule,
    // ChairModule provides chair-specific endpoints and entities
    ChairModule,
  ],
  controllers: [ReviewServiceController, PcMembersProxyController],
  providers: [
    ReviewServiceService,
    // JwtStrategy, JwtAuthGuard and RolesGuard are provided by AuthModule
  ],
})
export class ReviewServiceModule {}