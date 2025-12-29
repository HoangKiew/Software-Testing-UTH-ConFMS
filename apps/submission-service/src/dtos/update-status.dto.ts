import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubmissionStatus } from '../shared/constants/submission-status.enum';

export class UpdateStatusDto {
  @IsEnum(SubmissionStatus, {
    message: 'Status must be one of: SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED, WITHDRAWN, REVISION_REQUIRED'
  })
  status: SubmissionStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
