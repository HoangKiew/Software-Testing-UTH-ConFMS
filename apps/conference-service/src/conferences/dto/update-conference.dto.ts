// apps/conference-service/src/conferences/dto/update-conference.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateConferenceDto } from './create-conference.dto';
import { ConferenceStatus } from '../entities/conference.entity';

export class UpdateConferenceDto extends PartialType(CreateConferenceDto) {
  @ApiPropertyOptional({
    enum: ConferenceStatus,
    description: 'Trạng thái hội nghị (nếu cập nhật)',
    example: ConferenceStatus.OPEN_FOR_SUBMISSION, // ← Sửa thành giá trị hợp lệ từ enum (ví dụ: 'open_for_submission')
  })
  status?: ConferenceStatus;
}