import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RoleName } from '../entities/role.entity';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Cập nhật roles cho user (admin thực hiện)',
    enum: RoleName,
    example: RoleName.CHAIR,
  })
  @IsEnum(RoleName)
  role: RoleName;
}

