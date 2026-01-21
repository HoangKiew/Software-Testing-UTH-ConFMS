import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RecipientType {
  PC_MEMBERS = 'PC_MEMBERS',
  AUTHORS = 'AUTHORS',
  REVIEWERS = 'REVIEWERS',
  CHAIRS = 'CHAIRS',
}

export class BulkNotificationDto {
  @ApiProperty({
    description: 'Loại người nhận email',
    enum: RecipientType,
    example: RecipientType.PC_MEMBERS,
  })
  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @ApiProperty({
    description: 'ID của email template để sử dụng (tùy chọn, nếu không có sẽ dùng subject và body)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  templateId?: number;

  @ApiProperty({
    description: 'Các biến để thay thế trong template (ví dụ: {{authorName}}, {{deadline}})',
    example: {
      deadline: '2025-03-15',
      conferenceName: 'International UTH Conference 2025',
      authorName: 'Nguyễn Văn A',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiProperty({
    description: 'Tiêu đề email (tùy chọn, nếu có templateId thì sẽ dùng subject từ template)',
    example: 'Reminder: Review Deadline Approaching',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subject?: string;

  @ApiProperty({
    description: 'Nội dung email (tùy chọn, nếu có templateId thì sẽ dùng body từ template)',
    example: 'Dear reviewer,\n\nThis is a reminder that the review deadline is approaching...',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  body?: string;
}













