// apps/conference-service/src/conferences/dto/update-deadlines.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateDeadlinesDto {
  @ApiPropertyOptional({
    description: 'Deadline nộp bài (ISO date-time)',
    type: String,
    format: 'date-time',
    example: '2026-03-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  submission?: string;

  @ApiPropertyOptional({
    description: 'Deadline review (ISO date-time)',
    type: String,
    format: 'date-time',
    example: '2026-04-15T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  review?: string;

  @ApiPropertyOptional({
    description: 'Deadline camera-ready (ISO date-time)',
    type: String,
    format: 'date-time',
    example: '2026-05-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  cameraReady?: string;
}