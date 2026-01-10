// apps/conference-service/src/invitations/dto/update-topics.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTopicsDto {
  @ApiProperty({
    type: [String],
    description:
      'Danh sách chuyên môn/kỹ năng của reviewer cho hội nghị này. ' +
      'Mỗi topic là chuỗi không rỗng, tối thiểu 1 và tối đa 20 topics.',
    example: ['Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Deep Learning'],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray({ message: 'Topics phải là một mảng các chuỗi' })
  @ArrayMinSize(1, { message: 'Phải cung cấp ít nhất 1 chuyên môn' })
  @ArrayMaxSize(20, { message: 'Tối đa chỉ được 20 chuyên môn' })
  @IsString({ each: true, message: 'Mỗi topic phải là chuỗi' })
  @IsNotEmpty({ each: true, message: 'Topic không được để trống' })
  @Type(() => String)
  topics: string[];
}