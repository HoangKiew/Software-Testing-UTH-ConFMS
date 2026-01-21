import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddTrackMemberDto {
  @ApiProperty({
    description: 'ID của user',
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  userId: number;
}












