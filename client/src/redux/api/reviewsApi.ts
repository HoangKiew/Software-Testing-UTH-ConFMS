import { apiSlice } from './apiSlice';
import type {
  Review,
  ReviewAssignment,
  ApiResponse,
} from '../../types/api.types';

export const reviewsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get my review assignments
    getMyAssignments: builder.query<ApiResponse<ReviewAssignment[]>, void>({
      query: () => '/reviews/assignments/me',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Assignment' as const, id })),
              { type: 'Assignment', id: 'MY_LIST' },
            ]
          : [{ type: 'Assignment', id: 'MY_LIST' }],
    }),
    // Get review by ID
    getReviewById: builder.query<ApiResponse<Review>, number>({
      query: (id) => `/reviews/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Review', id }],
    }),
    // Get anonymized reviews for a submission (for authors)
    getAnonymizedReviewsForSubmission: builder.query<
      ApiResponse<Array<{ score: number; commentForAuthor: string; recommendation: string }>>,
      string
    >({
      query: (submissionId) => `/reviews/submission/${submissionId}/anonymized`,
      providesTags: (_result, _error, submissionId) => [
        { type: 'Review', id: `submission-${submissionId}` },
      ],
    }),
  }),
});

export const {
  useGetMyAssignmentsQuery,
  useGetReviewByIdQuery,
  useGetAnonymizedReviewsForSubmissionQuery,
} = reviewsApi;

