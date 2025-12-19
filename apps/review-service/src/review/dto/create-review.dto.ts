export class CreateReviewDto {
  submissionId: string;
  reviewerId: string;
  score: number;
  comment?: string;
}
