// apps/conference-service/src/invitations/dto/update-coi.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsNumber,
    IsString,
    ArrayMaxSize,
    IsNotEmpty,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCoiDto {
    @ApiProperty({
        type: [Number],
        description: 'Danh sách userId mà reviewer có xung đột lợi ích (tối đa 20)',
        example: [123, 456, 789],
        maxItems: 20,
    })
    @IsArray({ message: 'coiUserIds phải là mảng các số nguyên' })
    @ArrayMaxSize(20, { message: 'Tối đa 20 userId' })
    @IsNumber({}, { each: true, message: 'Mỗi coiUserId phải là số nguyên' })
    @Type(() => Number)
    coiUserIds: number[];

    @ApiProperty({
        type: [String],
        description: 'Danh sách tổ chức/tên miền có xung đột lợi ích (tối đa 20)',
        example: ['university.edu', 'company.com'],
        maxItems: 20,
    })
    @IsArray({ message: 'coiInstitutions phải là mảng các chuỗi' })
    @ArrayMaxSize(20, { message: 'Tối đa 20 institutions' })
    @IsString({ each: true, message: 'Mỗi coiInstitution phải là chuỗi' })
    @IsNotEmpty({ each: true, message: 'Institution không được để trống' })
    @Type(() => String)
    coiInstitutions: string[];
}