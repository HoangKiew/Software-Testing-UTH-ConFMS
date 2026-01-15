// apps/conference-service/src/invitations/dto/invite-reviewer.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEmail } from 'class-validator';

export class InviteReviewerDto {
  @ApiProperty({
    description: 'ID của hội nghị cần mời reviewer tham gia',
    example: 'conf-123',
  })
  @IsString()
  conferenceId: string;

  @ApiProperty({
    description: 'ID của user cần mời làm reviewer',
    example: 456,
  })
  @IsNumber()
  userId: number;

  @ApiPropertyOptional({
    description: 'Email của reviewer (tùy chọn, nếu cung cấp sẽ ưu tiên dùng để gửi lời mời)',
    example: 'reviewer@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ nếu được cung cấp' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Tên hiển thị của reviewer (tùy chọn)',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  name?: string;
}