// apps/conference-service/src/pc-members/dto/invite-pc-member.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { PcMemberRole } from '../entities/pc-member.entity';

export class InvitePcMemberDto {
  @ApiProperty({
    description: 'ID của hội nghị',
    example: 'conf-123',
  })
  @IsString()
  conferenceId: string;

  @ApiProperty({
    description: 'ID của user cần mời (email sẽ lấy tự động từ userId)',
    example: 456,
  })
  @IsNumber()
  userId: number;

  @ApiPropertyOptional({
    enum: PcMemberRole,
    description: 'Role của thành viên (mặc định: REVIEWER)',
    example: PcMemberRole.REVIEWER,
  })
  @IsOptional()
  @IsEnum(PcMemberRole)
  role?: PcMemberRole;
}