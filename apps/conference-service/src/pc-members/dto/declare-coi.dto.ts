// apps/conference-service/src/pc-members/dto/declare-coi.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class DeclareCoiDto {
  @ApiProperty({
    type: [Number],
    description: 'Danh sách userId có xung đột lợi ích',
    example: [123, 456],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  coiUserIds: number[];

  @ApiProperty({
    type: [String],
    description: 'Danh sách tổ chức/cơ quan có xung đột lợi ích',
    example: ['University A', 'Company B'],
  })
  @IsArray()
  @IsString({ each: true })
  coiInstitutions: string[];
}