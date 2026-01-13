// apps/conference-service/src/conferences/dto/update-conference.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateConferenceDto } from './create-conference.dto';
import { ConferenceStatus } from '../entities/conference.entity';

export class UpdateConferenceDto extends PartialType(CreateConferenceDto) {
  @ApiPropertyOptional({
    enum: ConferenceStatus,
    description: 'Trạng thái hội nghị (nếu cập nhật)',
    example: ConferenceStatus.OPEN,
  })
  @IsEnum(ConferenceStatus)
  @IsOptional()
  status?: ConferenceStatus;
}