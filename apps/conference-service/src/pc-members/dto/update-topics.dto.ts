import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class UpdateTopicsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20) // giới hạn hợp lý
  topics: string[];
}