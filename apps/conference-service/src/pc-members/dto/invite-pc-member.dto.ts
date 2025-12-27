// src/pc-members/dto/invite-pc-member.dto.ts
import { IsString, IsNumber, IsEmail, IsEnum } from 'class-validator';
import { PcMemberRole } from '../entities/pc-member.entity';

export class InvitePcMemberDto {
  @IsString()
  conferenceId: string;

  @IsNumber()
  userId: number;

  @IsEmail()
  email: string;

  @IsEnum(PcMemberRole)
  role: PcMemberRole;
}