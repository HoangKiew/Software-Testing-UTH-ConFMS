import { IsOptional, IsEnum, IsInt, Min, Max, IsDateString, IsString, MaxLength, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SubmissionStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    WITHDRAWN = 'WITHDRAWN',
}

export class QuerySubmissionsDto {
    @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Filter by status', enum: SubmissionStatus })
    @IsOptional()
    @IsEnum(SubmissionStatus)
    status?: SubmissionStatus;

    @ApiPropertyOptional({ description: 'Filter by conference ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    conferenceId?: string;

    @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)', example: '2025-01-01' })
    @IsOptional()
    @IsDateString()
    createdFrom?: string;

    @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)', example: '2025-12-31' })
    @IsOptional()
    @IsDateString()
    createdTo?: string;

    @ApiPropertyOptional({ description: 'Search in title (case-insensitive)', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'updatedAt', 'title'], default: 'createdAt' })
    @IsOptional()
    @IsIn(['createdAt', 'updatedAt', 'title'])
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    order?: 'ASC' | 'DESC' = 'DESC';
}
