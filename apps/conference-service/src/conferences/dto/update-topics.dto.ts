// apps/conference-service/src/conferences/dto/update-topics.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateTopicsDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách chủ đề mới',
    example: ['AI', 'Machine Learning', 'NLP']
  })
  @IsArray()
  @IsString({ each: true })
  topics: string[];
}