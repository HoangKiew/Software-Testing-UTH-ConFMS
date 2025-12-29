import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateConferenceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  venue: string;
}

