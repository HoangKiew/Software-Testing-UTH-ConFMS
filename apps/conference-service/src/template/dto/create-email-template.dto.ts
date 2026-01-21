import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MaxLength,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailTemplateType } from '../entities/email-template.entity';

export class CreateEmailTemplateDto {
  @ApiProperty({
    description: 'Tên của email template',
    example: 'buivanhuy2706@gmail.com',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Loại email template',
    enum: EmailTemplateType,
    example: EmailTemplateType.DECISION_ACCEPTED,
  })
  @IsEnum(EmailTemplateType)
  type: EmailTemplateType;

  @ApiProperty({
    description: 'Tiêu đề email',
    example: 'Chúc mừng bài bạn được chấp nhận',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    description: 'Nội dung email ',
    example: "Chúc mừng bài thi đã được chấp nhận, Kính gửi người nộp, bài nộp của bạn (Bài học docker) đã được chấp nhận cho hội nghị thi công nghệ 2026, Trân trọng Ban tổ chức Bui Van Huy",

  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Danh sách các biến có thể sử dụng trong template',
    example: {
      authorName: 'Bùi Văn Huy(Author)',
      submissionTitle: 'Bài học docker',
      conferenceName: 'Cuộc THi Công Nghệ 2026',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}





