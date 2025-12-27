import { IsString, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateConferenceDto {
  @IsString()
  name: string;

  @IsString()
  acronym: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @IsOptional()
  topics?: string[];

  @IsOptional()
  deadlines?: {
    submission?: string;
    review?: string;
    cameraReady?: string;
  };
}