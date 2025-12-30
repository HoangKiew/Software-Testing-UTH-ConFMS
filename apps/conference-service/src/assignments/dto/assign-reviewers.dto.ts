// src/assignments/dto/assign-reviewers.dto.ts
import { IsString, IsArray } from 'class-validator';

export class AssignReviewersDto {
  @IsString()
  submissionId: string;

  @IsArray()
  @IsString({ each: true })
  reviewerIds: string[]; // array pc_member.id
}