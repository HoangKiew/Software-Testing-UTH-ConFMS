import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDiscussionDto {
  @ApiProperty({
    description: 'ID của submission (UUID)',
    example: '8ccd4365-3258-4b87-8903-c48d06189ed1',
  })
  @IsUUID()
  @IsNotEmpty()
  submissionId: string;

  @ApiProperty({
    description: 'Nội dung thảo luận',
    example: 'Tôi nghĩ cần thêm 1 reviewer nữa cho chủ đề này.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
