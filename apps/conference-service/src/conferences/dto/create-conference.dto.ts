// apps/conference-service/src/conferences/dto/create-conference.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsArray, IsOptional, IsObject } from 'class-validator';

export class CreateConferenceDto {
  @ApiProperty({ description: 'Tên hội nghị', example: 'Hội nghị Công nghệ 2026' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Viết tắt của hội nghị', example: 'CONF2026' })
  @IsString()
  acronym: string;

  @ApiPropertyOptional({ description: 'Mô tả hội nghị', example: 'Hội nghị về AI và Machine Learning' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Ngày bắt đầu (ISO date)', example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Ngày kết thúc (ISO date)', example: '2026-01-03' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ type: [String], description: 'Danh sách chủ đề', example: ['AI', 'ML'] })
  @IsArray()
  @IsOptional()
  topics?: string[];

  @ApiPropertyOptional({
    type: Object,
    description: 'Các mốc thời gian (deadlines)',
    example: { submission: '2025-12-01', review: '2025-12-15', cameraReady: '2026-01-01' },
  })
  @IsObject()
  @IsOptional()
  deadlines?: {
    submission?: string;
    review?: string;
    cameraReady?: string;
  };
}