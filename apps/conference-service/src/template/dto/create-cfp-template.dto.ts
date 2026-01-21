import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCfpTemplateDto {
  @ApiProperty({
    description: 'Nội dung HTML cho trang CFP (có thể dùng variables như {{conferenceName}}, {{deadline}})',
    example: '<html><body><h1>{{conferenceName}}</h1><p>Welcome to our conference! Submission deadline: {{submissionDeadline}}</p></body></html>',
  })
  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @ApiProperty({
    description: 'Custom CSS styles (optional)',
    example: {
      primaryColor: '#007bff',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customStyles?: Record<string, any>;
}





