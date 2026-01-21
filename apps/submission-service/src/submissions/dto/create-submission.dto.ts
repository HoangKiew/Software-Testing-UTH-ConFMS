import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Tiêu đề bài báo',
    example: 'Machine Learning in Healthcare',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiProperty({
    description: 'Tóm tắt bài báo',
    example: 'This paper presents a novel approach to...',
  })
  @IsString()
  @IsNotEmpty()
  abstract: string;

  @ApiProperty({
    description: 'Từ khóa (tùy chọn)',
    example: 'machine learning, healthcare, AI',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  keywords?: string;

  @ApiProperty({
    description: 'ID của track',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  trackId: number;

  @ApiProperty({
    description: 'ID của conference',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  conferenceId: number;

  @ApiProperty({
    description: 'Tổ chức/Trường đại học của tác giả chính',
    example: 'Đại học Công nghệ Thông tin',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  authorAffiliation?: string;

  @ApiProperty({
    description: 'Danh sách đồng tác giả (JSON string)',
    example: '[{"name":"Nguyễn Văn A","email":"a@example.com","affiliation":"UTH"}]',
    required: false,
  })
  @IsString()
  @IsOptional()
  coAuthors?: string;
}



