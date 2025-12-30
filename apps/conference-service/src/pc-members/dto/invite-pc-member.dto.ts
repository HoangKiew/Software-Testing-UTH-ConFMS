// src/pc-members/dto/invite-pc-member.dto.ts
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { PcMemberRole } from '../entities/pc-member.entity';

export class InvitePcMemberDto {
  @IsString()
  conferenceId: string;

  @IsNumber()
  userId: number;

  // BỎ @IsEmail() và trường email hoàn toàn
  // Email sẽ được lấy tự động từ UsersClient dựa trên userId

  @IsOptional()              // Cho phép không gửi role
  @IsEnum(PcMemberRole)
  role?: PcMemberRole;       // Mặc định sẽ là PC_MEMBER nếu không cung cấp
}