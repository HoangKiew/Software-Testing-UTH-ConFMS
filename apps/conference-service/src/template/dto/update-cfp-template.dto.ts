import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCfpTemplateDto {
  @ApiProperty({
    description: 'Nội dung HTML cho trang CFP',
    example: '<html><body><h1>{{conferenceName}}</h1><p>Updated content...</p></body></html>',
    required: false,
  })
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @ApiProperty({
    description: 'Custom CSS styles',
    example: {
      primaryColor: '#007bff',
      fontFamily: 'Arial',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customStyles?: Record<string, any>;
}





