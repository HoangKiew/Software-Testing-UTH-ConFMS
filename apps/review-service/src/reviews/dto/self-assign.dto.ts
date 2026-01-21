import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelfAssignDto {
  @ApiProperty({
    description: 'ID của submission (UUID)',
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
}
