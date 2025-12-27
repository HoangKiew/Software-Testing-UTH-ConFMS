import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class AuthorDto {
    @IsString()
    @IsNotEmpty()
    author_name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    affiliation: string;

    @IsOptional()
    @IsBoolean()
    is_corresponding: boolean;
}