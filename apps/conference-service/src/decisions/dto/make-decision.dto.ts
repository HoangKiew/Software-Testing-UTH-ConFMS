// src/decisions/dto/make-decision.dto.ts
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DecisionType } from '../entities/decision.entity';

export class MakeDecisionDto {
  @IsString()
  submissionId: string;

  @IsEnum(DecisionType)
  decision: DecisionType;

  @IsOptional()
  @IsString()
  feedback?: string; // Phản hồi ẩn danh gửi cho tác giả (tùy chọn)
}