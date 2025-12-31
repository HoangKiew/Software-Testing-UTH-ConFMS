// apps/conference-service/src/decisions/dto/make-decision.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DecisionType } from '../entities/decision.entity';

export class MakeDecisionDto {
  @ApiProperty({
    description: 'ID của bài nộp (submission)',
    example: 'sub-123456',
  })
  @IsString()
  submissionId: string;

  @ApiProperty({
    enum: DecisionType,
    description: 'Quyết định cuối cùng của Chair',
    example: DecisionType.ACCEPT,
  })
  @IsEnum(DecisionType, {
    message: `decision phải là một trong: ${Object.values(DecisionType).join(', ')}`,
  })
  decision: DecisionType;

  @ApiPropertyOptional({
    description: 'Phản hồi ẩn danh gửi cho tác giả (tùy chọn)',
    example: 'Bài báo rất tốt, phù hợp với chủ đề hội nghị.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}
