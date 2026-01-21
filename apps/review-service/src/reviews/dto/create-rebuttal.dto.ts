import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRebuttalDto {
  @ApiProperty({
    description: 'ID của submission (UUID)',
    example: '8ccd4365-3258-4b87-8903-c48d06189ed1',
  })
  @IsUUID()
  @IsNotEmpty()
  submissionId: string;

  @ApiProperty({
    description: 'ID của conference (tùy chọn)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  conferenceId?: number;

  @ApiProperty({
    description: 'Nội dung phản hồi từ tác giả',
    example: 'Chúng tôi đã cập nhật phần thí nghiệm như góp ý của reviewers.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}


















