// apps/conference-service/src/decisions/dto/make-decision.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';  // ← Thay IsEnum bằng IsIn
import { DecisionType } from '../entities/decision.entity';

export class MakeDecisionDto {
  @ApiProperty({
    description: 'ID của bài nộp (submission)',
    example: 'sub-123456',
  })
  @IsString()
  submissionId: string;

  @ApiProperty({
    enum: ['accept', 'reject', 'revise', 'withdraw'],  // ← Hiển thị lowercase trong Swagger
    description: 'Quyết định cuối cùng của Chair (không phân biệt hoa/thường)',
    example: 'accept',
  })
  @IsIn(['accept', 'ACCEPT', 'reject', 'REJECT', 'revise', 'REVISE', 'withdraw', 'WITHDRAW'], {
    message: 'decision phải là một trong: accept, reject, revise, withdraw (không phân biệt hoa/thường)',
  })
  decision: string;  // ← Đổi sang string để linh hoạt

  @ApiPropertyOptional({
    description: 'Phản hồi ẩn danh gửi cho tác giả (tùy chọn)',
    example: 'Bài báo rất tốt, phù hợp với chủ đề hội nghị.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}