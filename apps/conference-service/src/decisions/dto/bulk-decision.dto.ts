// src/decisions/dto/bulk-decision.dto.ts
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MakeDecisionDto } from './make-decision.dto';

export class BulkDecisionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MakeDecisionDto)
  decisions: MakeDecisionDto[];
}