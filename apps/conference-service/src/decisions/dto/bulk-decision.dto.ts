// apps/conference-service/src/decisions/dto/bulk-decision.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MakeDecisionDto } from './make-decision.dto';

export class BulkDecisionDto {
  @ApiProperty({
    type: [MakeDecisionDto],
    description: 'Danh sách các quyết định cho nhiều bài nộp',
    example: [
      {
        submissionId: 'sub-123',
        decision: 'ACCEPT',
        feedback: 'Bài tốt, chấp nhận oral presentation',
      },
      {
        submissionId: 'sub-456',
        decision: 'REJECT',
        feedback: 'Chủ đề chưa phù hợp với hội nghị',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MakeDecisionDto)
  decisions: MakeDecisionDto[];
}