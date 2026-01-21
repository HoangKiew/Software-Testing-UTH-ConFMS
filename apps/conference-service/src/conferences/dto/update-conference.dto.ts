import { IsDateString, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConferenceDto {
  @ApiProperty({
    description: 'Tên hội nghị',
    example: 'International UTH Conference 2025 Updated',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Ngày bắt đầu (ISO 8601)',
    example: '2025-06-01T09:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Ngày kết thúc (ISO 8601)',
    example: '2025-06-03T18:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Địa điểm tổ chức',
    example: 'HCMC University of Transport - Main Campus',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  venue?: string;

  @ApiProperty({
    description: 'Mô tả chi tiết về hội nghị',
    example: 'International Conference on Transportation and Logistics 2025...',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Mô tả ngắn gọn cho trang CFP (tối đa 500 ký tự)',
    example: 'Join us for the premier conference on transportation research...',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({
    description: 'Email liên hệ cho hội nghị',
    example: 'conference@uth.edu.vn',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  contactEmail?: string;
}




