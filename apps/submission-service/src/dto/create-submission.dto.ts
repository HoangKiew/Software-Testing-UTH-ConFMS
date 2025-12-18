// Định nghĩa các trường dữ liệu khi nộp bài (title, abstract, authors...)
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateSubmissionDto {
  @IsNumber()
  conferenceId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsNumber()
  createdBy: number; // ID của tác giả nộp bài

  @IsOptional()
  @IsArray()
  authors?: any[]; // Danh sách đồng tác giả (nếu có)
}