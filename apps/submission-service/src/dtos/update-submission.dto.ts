import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AuthorDto } from './author.dto';

export class UpdateSubmissionDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    abstract?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AuthorDto)
    authors?: AuthorDto[];
}
