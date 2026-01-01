import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuthorDto } from './author.dto';

export class UpdateSubmissionDto {
    @ApiProperty({ description: 'Paper title', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ description: 'Paper abstract', required: false })
    @IsOptional()
    @IsString()
    abstract?: string;

    @ApiProperty({ description: 'List of authors', type: [AuthorDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AuthorDto)
    authors?: AuthorDto[];
}
