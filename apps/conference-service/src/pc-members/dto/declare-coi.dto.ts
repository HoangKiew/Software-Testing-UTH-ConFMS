// src/pc-members/dto/declare-coi.dto.ts
import { IsArray, IsString, IsNumber } from 'class-validator';

export class DeclareCoiDto {
  @IsArray()
  @IsNumber({}, { each: true })
  coiUserIds: number[];

  @IsArray()
  @IsString({ each: true })
  coiInstitutions: string[];
}