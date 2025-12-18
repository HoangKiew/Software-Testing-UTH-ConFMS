import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { RoleName } from '../entities/role.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsEnum(RoleName)
  role: RoleName;
}
