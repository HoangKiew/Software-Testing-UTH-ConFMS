import { apiSlice } from './apiSlice';
import type {
  Review,
  ReviewAssignment,
  Submission,
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
    // Accept assignment
    acceptAssignment: builder.mutation<ApiResponse<ReviewAssignment>, number>({
      query: (assignmentId) => ({
        url: `/reviews/assignments/${assignmentId}/accept`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, assignmentId) => [
        { type: 'Assignment', id: assignmentId },
        { type: 'Assignment', id: 'MY_LIST' },
      ],
    }),
    // Reject assignment
    rejectAssignment: builder.mutation<ApiResponse<ReviewAssignment>, number>({
      query: (assignmentId) => ({
        url: `/reviews/assignments/${assignmentId}/reject`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, assignmentId) => [
        { type: 'Assignment', id: assignmentId },
        { type: 'Assignment', id: 'MY_LIST' },
      ],
    }),
    // Self-assign submission (reviewer assigns to themselves)
    selfAssignSubmission: builder.mutation<
      ApiResponse<ReviewAssignment>,
      { submissionId: string; conferenceId: number }
    >({
      query: (body) => ({
        url: '/reviews/assignments/self',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Assignment', id: 'MY_LIST' },
        { type: 'Submission', id: 'REVIEWER_ACCEPTED_TRACKS' },
      ],
    }),
    // Create review
    createReview: builder.mutation<
      ApiResponse<Review>,
      {
        assignmentId: number;
        score: number;
        confidence: 'LOW' | 'MEDIUM' | 'HIGH';
        commentForAuthor: string;
        commentForPC?: string;
        recommendation: 'ACCEPT' | 'WEAK_ACCEPT' | 'REJECT' | 'WEAK_REJECT';
      }
    >({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { assignmentId }) => [
        { type: 'Review' as const, id: `assignment-${assignmentId}` },
        { type: 'Assignment' as const, id: assignmentId },
        { type: 'Assignment' as const, id: 'MY_LIST' },
        // Invalidate all submission list queries to ensure status updates are reflected
        // This is necessary because backend automatically updates submission status from SUBMITTED to REVIEWING
        { type: 'Submission' as const, id: 'LIST' },
        { type: 'Submission' as const, id: 'MY_LIST' },
        { type: 'Submission' as const, id: 'REVIEWER_ACCEPTED_TRACKS' },
        // Also invalidate all review-related submission tags
        // This ensures submission detail pages that show reviews will refetch
        { type: 'Review' as const, id: 'LIST' },
      ],
      async onQueryStarted({ assignmentId }, { dispatch, queryFulfilled, getState }) {
        // Get submissionId from assignment in cache to invalidate specific submission detail
        let submissionId: string | undefined;
        try {
          const assignmentsResult = reviewsApi.endpoints.getMyAssignments.select()(getState());
          if (assignmentsResult?.data?.data) {
            const assignment = assignmentsResult.data.data.find(a => a.id === assignmentId);
            if (assignment?.submissionId) {
              submissionId = String(assignment.submissionId);
            }
          }
        } catch (error) {
          // If we can't get submissionId from cache, that's okay - list queries are already invalidated
        }

        // Wait for query to complete
        try {
          await queryFulfilled;
        } catch (error) {
          // Query failed, don't invalidate additional tags
          return;
        }

        // If we have submissionId, invalidate specific submission detail and its reviews
        if (submissionId) {
          dispatch(
            apiSlice.util.invalidateTags([
              { type: 'Submission', id: submissionId },
              { type: 'Review', id: `submission-${submissionId}` },
            ])
          );
        }
      },
    }),
    // Get reviews for a submission
    getReviewsForSubmission: builder.query<ApiResponse<Review[]>, string>({
      query: (submissionId) => `/reviews/submission/${submissionId}`,
      providesTags: (_result, _error, submissionId) => [
        { type: 'Review', id: `submission-${submissionId}` },
      ],
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
    // Get submissions for reviewer in accepted tracks
    getSubmissionsForReviewer: builder.query<
      ApiResponse<Submission[]>,
      { status?: string[] } | void
    >({
      query: (params) => {
        // Convert status array to query string format: status=SUBMITTED&status=REVIEWING
        const queryParams: Record<string, string | string[]> = {};
        if (params?.status && Array.isArray(params.status) && params.status.length > 0) {
          queryParams.status = params.status;
        }
        
        return {
          url: '/reviews/submissions/accepted-tracks',
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      providesTags: [{ type: 'Submission', id: 'REVIEWER_ACCEPTED_TRACKS' }],
    }),
  }),
});

export const {
  useGetMyAssignmentsQuery,
  useAcceptAssignmentMutation,
  useRejectAssignmentMutation,
  useSelfAssignSubmissionMutation,
  useCreateReviewMutation,
  useGetReviewsForSubmissionQuery,
  useGetReviewByIdQuery,
  useGetAnonymizedReviewsForSubmissionQuery,
  useGetSubmissionsForReviewerQuery,
} = reviewsApi;

