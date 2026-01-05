// apps/conference-service/src/conferences/dto/update-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ConferenceStatus } from '../entities/conference.entity';

export class UpdateStatusDto {
  @ApiProperty({
    enum: ConferenceStatus,
    description: 'Trạng thái mới của hội nghị',
    example: ConferenceStatus.OPEN,
  })
  @IsEnum(ConferenceStatus, {
    message: 'status phải là một giá trị hợp lệ trong ConferenceStatus',
  })
  status: ConferenceStatus;
}