import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubmissionStatus } from '../shared/constants/submission-status.enum';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New status for the submission',
    enum: SubmissionStatus,
    example: SubmissionStatus.UNDER_REVIEW
  })
  @IsEnum(SubmissionStatus, {
    message: 'Status must be one of: SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED, WITHDRAWN, REVISION_REQUIRED'
  })
  status: SubmissionStatus;

  @ApiProperty({ description: 'Optional comment about status change', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
