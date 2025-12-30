// apps/conference-service/src/conferences/dto/update-schedule.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Cấu trúc chương trình hội nghị (JSON tùy ý)',
    type: 'object',
    additionalProperties: true,
    example: {
      days: [
        {
          date: '2026-06-01',
          sessions: [
            { time: '09:00', title: 'Opening Ceremony' },
            { time: '10:00', title: 'Keynote Speech' },
          ],
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  schedule: any; // Hoặc Record<string, any> nếu cần strict type
}