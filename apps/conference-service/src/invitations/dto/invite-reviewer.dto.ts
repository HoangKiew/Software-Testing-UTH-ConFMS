// apps/conference-service/src/invitations/dto/invite-reviewer.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class InviteReviewerDto {
  @ApiProperty({
    description: 'ID của hội nghị cần mời reviewer tham gia',
    example: 'conf-123',
  })
  @IsString()
  conferenceId: string;

  @ApiProperty({
    description: 'ID của user cần mời làm reviewer',
    example: 456,
  })
  @IsNumber()
  userId: number;
}