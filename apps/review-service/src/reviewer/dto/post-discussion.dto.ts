import { IsNotEmpty, IsString } from 'class-validator';

export class PostDiscussionDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}
