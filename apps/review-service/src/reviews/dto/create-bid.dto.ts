import { IsEnum, IsInt, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PreferenceType } from '../entities/review-preference.entity';

export class CreateBidDto {
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

  @ApiProperty({
    description: 'Mức độ quan tâm/bidding',
    enum: PreferenceType,
    example: PreferenceType.INTERESTED,
  })
  @IsEnum(PreferenceType)
  @IsNotEmpty()
  preference: PreferenceType;
}














