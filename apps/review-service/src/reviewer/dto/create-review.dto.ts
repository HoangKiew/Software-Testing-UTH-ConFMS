import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  score?: number;

  @IsOptional()
  @IsString()
  publicComment?: string;

  @IsOptional()
  @IsString()
  privateComment?: string;
}
