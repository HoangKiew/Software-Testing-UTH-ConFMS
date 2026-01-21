import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MaxLength,
  IsOptional,
  IsArray,
  ValidateNested,
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
    description: 'Loại input (text, textarea, select, email, number, etc.)',
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
    description: 'Danh sách options (cho select/dropdown)',
    example: ['Option 1', 'Option 2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({
    description: 'Validation rules (ví dụ: maxLength, minLength, pattern)',
    example: { maxLength: 500 },
    required: false,
  })
  @IsOptional()
  validation?: Record<string, any>;
}

export class CreateFormTemplateDto {
  @ApiProperty({
    description: 'Loại form template',
    enum: FormTemplateType,
    example: FormTemplateType.SUBMISSION_FORM,
  })
  @IsEnum(FormTemplateType)
  type: FormTemplateType;

  @ApiProperty({
    description: 'Tên của form template',
    example: 'Submission Form Template',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Danh sách các fields trong form',
    type: [FormFieldDto],
    example: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        validation: { maxLength: 500 },
      },
      {
        name: 'abstract',
        label: 'Abstract',
        type: 'textarea',
        required: true,
      },
      {
        name: 'keywords',
        label: 'Keywords',
        type: 'text',
        required: false,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];

  @ApiProperty({
    description: 'Mô tả về form template',
    example: 'Template for submission form with title, abstract, and keywords',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}





