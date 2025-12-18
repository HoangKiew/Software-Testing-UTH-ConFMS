import { IsString, IsArray, IsEnum } from 'class-validator';
import { SubmissionStatus } from '../entities/submission.entity';

export class CreateSubmissionDto {
  @IsString()
  conferenceId: string;

  @IsString()
  title: string;

  @IsString()
  abstract: string;

  @IsString()
  keywords: string;

  @IsArray()
  authors: number[];  // Array userIds

  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;  // Optional, default SUBMITTED
}