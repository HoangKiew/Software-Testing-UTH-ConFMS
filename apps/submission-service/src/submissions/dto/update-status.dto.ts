import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubmissionStatus } from '../../entities/submission.entity';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của submission',
    enum: SubmissionStatus,
    example: SubmissionStatus.ACCEPTED,
  })
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @ApiProperty({
    description: 'Ghi chú về quyết định (cho Chair/Admin)',
    example: 'Good paper, strong results, recommended for acceptance.',
    required: false,
  })
  @IsString()
  @IsOptional()
  decisionNote?: string;
}
