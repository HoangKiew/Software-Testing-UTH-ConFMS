import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewServiceController } from './review-service.controller';
import { ReviewServiceService } from './review-service.service';
import { Review } from './review/review.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Review]),
  ],
  controllers: [ReviewServiceController],
  providers: [ReviewServiceService],
})
export class ReviewServiceModule {}
