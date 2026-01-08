// apps/conference-service/src/pc-members/dto/update-pc-member-topics.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class UpdatePcMemberTopicsDto {  // ← ĐỔI TÊN CLASS TẠI ĐÂY
  @ApiProperty({
    type: [String],
    description: 'Danh sách chuyên môn mới (tối thiểu 1, tối đa 20)',
    example: ['AI', 'Machine Learning', 'NLP'],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  topics: string[];
}