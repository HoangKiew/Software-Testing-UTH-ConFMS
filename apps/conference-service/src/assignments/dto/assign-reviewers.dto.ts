// apps/conference-service/src/assignments/dto/assign-reviewers.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsInt } from 'class-validator';

export class AssignReviewersDto {
  @ApiProperty({
    description: 'ID của hội nghị',
    example: 'conf-123',
  })
  @IsString()
  @IsNotEmpty()
  conferenceId: string;

  @ApiProperty({
    description: 'Topic cần phân công reviewer',
    example: 'Machine Learning',
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({
    description: 'Danh sách user ID của REVIEWER được phân công',
    type: [Number],
    example: [101, 102, 103],
  })
  @IsArray()
  @IsInt({ each: true })
  reviewerIds: number[];
}