import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConferenceMemberRole } from '../entities/conference-member.entity';
import { Type } from 'class-transformer';

export class AddConferenceMemberDto {
  @ApiProperty({
    description: 'ID của user',
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Vai trò trong conference',
    enum: ConferenceMemberRole,
    example: ConferenceMemberRole.PC_MEMBER,
  })
  @IsEnum(ConferenceMemberRole)
  @IsNotEmpty()
  role: ConferenceMemberRole;
}

