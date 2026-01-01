import { IsString, IsEmail, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthorDto {
    @ApiProperty({ description: 'Author full name', example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    author_name: string;

    @ApiProperty({ description: 'Author email address', example: 'john.doe@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Author affiliation/institution', example: 'MIT' })
    @IsString()
    @IsNotEmpty()
    affiliation: string;

    @ApiProperty({ description: 'Is this the corresponding author?', example: true, required: false })
    @IsOptional()
    @IsBoolean()
    is_corresponding?: boolean;
}