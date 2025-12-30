import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateConferenceDto } from './create-conference.dto';
import { ConferenceStatus } from '../entities/conference.entity';

export class UpdateConferenceDto extends PartialType(CreateConferenceDto) {
  @ApiPropertyOptional({
    enum: ConferenceStatus,
    example: ConferenceStatus.PUBLISHED,
  })
  status?: ConferenceStatus;
}
