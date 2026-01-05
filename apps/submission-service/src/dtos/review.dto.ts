import { ApiProperty } from '@nestjs/swagger';

export class AnonymousReviewDto {
    @ApiProperty({
        description: 'ID review',
        example: 1
    })
    id: number;

    @ApiProperty({
        description: 'Tên ẩn danh của reviewer',
        example: 'Reviewer #1'
    })
    reviewerName: string;

    @ApiProperty({
        description: 'Điểm đánh giá (1-5)',
        example: 4
    })
    rating: number;

    @ApiProperty({
        description: 'Nhận xét của reviewer',
        example: 'Bài viết tốt, cần cải thiện phần methodology'
    })
    comment: string;

    @ApiProperty({
        description: 'Thời gian review',
        example: '2026-01-05T10:00:00Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Trạng thái review',
        example: 'COMPLETED'
    })
    status: string;
}
