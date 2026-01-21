import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ConfidenceLevel,
  RecommendationType,
} from '../entities/review.entity';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID của assignment',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  assignmentId: number;

  @ApiProperty({
    description: 'Điểm số (0-10)',
    example: 8,
    minimum: 0,
    maximum: 10,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Max(10)
  score: number;

  @ApiProperty({
    description: 'Mức độ tự tin khi chấm',
    enum: ConfidenceLevel,
    example: ConfidenceLevel.HIGH,
  })
  @IsEnum(ConfidenceLevel)
  @IsNotEmpty()
  confidence: ConfidenceLevel;

  @ApiProperty({
    description: 'Nhận xét cho tác giả (sẽ được hiển thị cho author sau khi có decision)',
    example: 'Bài viết tốt, cần chỉnh sửa một số phần nhỏ.',
    required: false,
  })
  @IsString()
  @IsOptional()
  commentForAuthor?: string;

  @ApiProperty({
    description: 'Nhận xét nội bộ cho PC (confidential)',
    example: 'Tác giả có thể cải thiện phần methodology.',
    required: false,
  })
  @IsString()
  @IsOptional()
  commentForPC?: string;

  @ApiProperty({
    description: 'Khuyến nghị',
    enum: RecommendationType,
    example: RecommendationType.ACCEPT,
  })
  @IsEnum(RecommendationType)
  @IsNotEmpty()
  recommendation: RecommendationType;
}
















