import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'UUID của hội nghị',
    example: '214eb9b6-3935-4b2e-a9a0-d14512d8ec6e'
  })
  @IsString()
  @IsUUID()
  conferenceId: string;

  @ApiProperty({
    description: 'Tiêu đề bài báo',
    example: 'Deep Learning cho Nhận Dạng Khuôn Mặt'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Tóm tắt bài báo',
    example: 'Bài báo này trình bày phương pháp mới...',
    required: false
  })
  @IsOptional()
  @IsString()
  abstract?: string;

  @ApiProperty({
    description: 'Email đồng tác giả (phân cách bằng dấu phẩy)',
    example: 'alice@example.com, bob@example.com',
    required: false
  })
  @IsOptional()
  @IsString()
  coAuthors?: string;

  @ApiProperty({
    description: 'Đơn vị/trường của tác giả chính',
    example: 'Đại học Giao thông Vận tải TP.HCM',
    required: false
  })
  @IsOptional()
  @IsString()
  affiliation?: string;

  // createdBy sẽ tự động lấy từ JWT token
  @IsOptional()
  createdBy?: number;
}