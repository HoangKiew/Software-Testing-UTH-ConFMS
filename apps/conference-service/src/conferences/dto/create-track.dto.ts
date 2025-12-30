// apps/conference-service/src/conferences/dto/create-track.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTrackDto {
  @ApiProperty({
    description: 'Tên của track (e.g., "AI Track")',
    example: 'Machine Learning Track',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}