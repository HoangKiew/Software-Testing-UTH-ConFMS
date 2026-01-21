import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FormTemplateType, FormField } from '../entities/form-template.entity';

export class FormFieldDto implements FormField {
  @ApiProperty({
    description: 'Tên field (dùng trong code)',
    example: 'title',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Nhãn hiển thị cho field',
    example: 'Title',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'Loại input',
    example: 'text',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Field có bắt buộc hay không',
    example: true,
  })
  @IsNotEmpty()
  required: boolean;

  @ApiProperty({
    description: 'Danh sách options (cho select)',
    example: ['Option 1', 'Option 2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({
    description: 'Validation rules',
    example: { maxLength: 500 },
    required: false,
  })
  @IsOptional()
  validation?: Record<string, any>;
}

export class UpdateFormTemplateDto {
  @ApiProperty({
    description: 'Loại form template',
    enum: FormTemplateType,
    example: FormTemplateType.SUBMISSION_FORM,
    required: false,
  })
  @IsOptional()
  @IsEnum(FormTemplateType)
  type?: FormTemplateType;

  @ApiProperty({
    description: 'Tên của form template',
    example: 'Submission Form Template (Updated)',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Danh sách các fields trong form',
    type: [FormFieldDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields?: FormFieldDto[];

  @ApiProperty({
    description: 'Mô tả về form template',
    example: 'Updated template description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

