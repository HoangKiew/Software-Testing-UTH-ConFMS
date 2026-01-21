import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SubmissionStatus } from '../../entities/submission.entity';

export class QuerySubmissionsDto {
  @ApiProperty({
    description: 'Số trang (bắt đầu từ 1)',
    example: 1,
    required: false,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng items mỗi trang',
    example: 10,
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter theo track ID',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  trackId?: number;

  @ApiProperty({
    description: 'Filter theo conference ID',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  conferenceId?: number;

  @ApiProperty({
    description: 'Filter theo status của submission',
    enum: SubmissionStatus,
    example: SubmissionStatus.SUBMITTED,
    required: false,
  })
  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;

  @ApiProperty({
    description: 'Tìm kiếm trong title, abstract, keywords',
    example: 'machine learning',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string; // Search in title, abstract, keywords

  @ApiProperty({
    description: 'Filter theo author ID (chỉ Chair/Admin)',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  authorId?: number;
}
