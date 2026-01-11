// apps/conference-service/src/assignments/dto/suggest-reviewers.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO dùng cho query parameters của endpoint gợi ý reviewer
 * GET /assignments/suggest/:conferenceId/:topic
 */
export class SuggestReviewersQueryDto {
  @ApiProperty({
    description: 'Số lượng reviewer gợi ý tối đa trả về',
    example: 10,
    minimum: 1,
    maximum: 20,
    default: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'top phải là số nguyên' })
  @Min(1, { message: 'top phải lớn hơn hoặc bằng 1' })
  top?: number = 5;

  // Nếu sau này muốn thêm các filter khác (ví dụ: minSimilarity, excludeReviewerIds...)
  // có thể bổ sung ở đây
}

/**
 * DTO dùng để validate path parameters (nếu muốn tách riêng)
 * Hoặc dùng trực tiếp trong controller với @Param()
 */
export class SuggestReviewersParamsDto {
  @ApiProperty({
    description: 'ID của hội nghị (UUID)',
    example: 'c2a65b80-fd67-474e-8390-895c76422f10',
  })
  @IsString()
  @IsUUID('all', { message: 'conferenceId phải là UUID hợp lệ' })
  conferenceId: string;

  @ApiProperty({
    description: 'Tên topic cần gợi ý reviewer',
    example: 'Machine Learning',
  })
  @IsString()
  topic: string;
}