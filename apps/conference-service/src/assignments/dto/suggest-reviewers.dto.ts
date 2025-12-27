// src/assignments/dto/suggest-reviewers.dto.ts
import { IsOptional, IsNumber } from 'class-validator';

export class SuggestReviewersDto {
  @IsOptional()
  @IsNumber()
  top?: number; // Không cần default ở đây, sẽ xử lý trong controller
}