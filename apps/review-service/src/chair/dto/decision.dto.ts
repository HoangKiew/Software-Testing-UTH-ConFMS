import { IsIn, IsOptional, IsString } from 'class-validator';

export class DecisionDto {
  @IsIn(['accepted', 'rejected'])
  decision: 'accepted' | 'rejected';

  @IsOptional()
  @IsString()
  note?: string;
}
