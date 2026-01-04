// apps/conference-service/src/assignments/dto/suggest-reviewers.dto.ts
// → Không cần DTO riêng cho query param vì NestJS tự validate @Query()
// Nhưng nếu bạn muốn giữ file này để document Swagger, có thể chuyển thành class để dùng trong @ApiQuery

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SuggestReviewersQueryDto {
  @ApiProperty({
    description: 'Số lượng gợi ý reviewer trả về (mặc định: 5)',
    required: false,
    minimum: 1,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  top?: number;
}