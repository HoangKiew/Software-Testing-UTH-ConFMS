// apps/conference-service/src/assignments/dto/assign-reviewers.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class AssignReviewersDto {
  @ApiProperty({
    description: 'ID của bài nộp (submission)',
    example: 'sub-123456',
  })
  @IsString()
  @IsNotEmpty()
  submissionId: string;

  @ApiProperty({
    description: 'Danh sách ID của PC Member được phân công review',
    type: [String],
    example: ['pcm-001', 'pcm-002', 'pcm-003'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  reviewerIds: string[];
}