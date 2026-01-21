import { IsInt, IsNotEmpty, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({
    description: 'number id của reviewer',
    example: 5,
  })
  @IsInt()
  @IsNotEmpty()
  reviewerId: number;

  @ApiProperty({
    description: 'string id của submission',
    example: '8ccd4365-3258-4b87-8903-c48d06189ed1',
  })
  @IsUUID()
  @IsNotEmpty()
  submissionId: string; 

  @ApiProperty({
    description: 'ID của conference',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  conferenceId: number;

  @ApiProperty({
    description: 'Hạn nộp review (ISO 8601 format)',
    example: '2025-02-01T23:59:59.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}











