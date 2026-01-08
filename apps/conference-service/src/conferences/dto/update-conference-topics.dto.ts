// apps/conference-service/src/conferences/dto/update-conference-topics.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateConferenceTopicsDto {  // ← ĐỔI TÊN CLASS TẠI ĐÂY
  @ApiProperty({
    type: [String],
    description: 'Danh sách chủ đề mới của hội nghị',
    example: ['AI', 'Machine Learning', 'NLP']
  })
  @IsArray()
  @IsString({ each: true })
  topics: string[];
}