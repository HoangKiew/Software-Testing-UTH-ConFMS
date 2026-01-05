import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AuthorDto } from './author.dto';

export class CreateSubmissionDto {
  @IsString()
  conferenceId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsOptional()
  @IsNumber()
  createdBy: number; // Có thể optional vì sẽ lấy từ Token

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return [];
      }
    }
    return value;
  })
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  authors?: AuthorDto[];
}