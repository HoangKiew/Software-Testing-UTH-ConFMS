// apps/conference-service/src/invitations/dto/update-topics.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  ArrayMaxSize,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTopicsDto {
  @ApiProperty({
    type: [String],
    description:
      'Danh sách chuyên môn/kỹ năng của reviewer cho hội nghị này. ' +
      'Có thể để trống (không khai báo), tối đa 20 topics. ' +
      'Nếu trống nghĩa là reviewer không giới hạn theo topic.',
    example: ['Artificial Intelligence', 'Machine Learning'],
    maxItems: 20,
  })
  @IsArray({ message: 'Topics phải là một mảng các chuỗi' })
  @ArrayMaxSize(20, { message: 'Tối đa chỉ được 20 chuyên môn' })
  @IsString({ each: true, message: 'Mỗi topic phải là chuỗi' })
  @IsNotEmpty({ each: true, message: 'Topic không được để trống' })
  @Type(() => String)
  topics: string[];
}