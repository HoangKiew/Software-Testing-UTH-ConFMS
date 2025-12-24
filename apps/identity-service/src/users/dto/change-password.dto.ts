import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu cũ',
    example: 'oldpassword123',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
    example: 'newpassword456',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

