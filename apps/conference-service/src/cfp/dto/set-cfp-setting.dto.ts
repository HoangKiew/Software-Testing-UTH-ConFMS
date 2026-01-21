import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetCfpSettingDto {
  @ApiProperty({
    description: 'Hạn nộp bài (ISO 8601 format)',
    example: '2025-03-01T23:59:59.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  submissionDeadline: string;

  @ApiProperty({
    description: 'Hạn review (ISO 8601 format)',
    example: '2025-03-15T23:59:59.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  reviewDeadline: string;

  @ApiProperty({
    description: 'Ngày thông báo kết quả (ISO 8601 format)',
    example: '2025-04-01T12:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  notificationDate: string;

  @ApiProperty({
    description: 'Hạn nộp camera-ready (ISO 8601 format)',
    example: '2025-04-15T23:59:59.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  cameraReadyDeadline: string;
}
