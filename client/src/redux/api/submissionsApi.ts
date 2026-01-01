import { apiSlice } from './apiSlice';
import type {
  Submission,
  UpdateSubmissionDto,
  UpdateStatusDto,
  QuerySubmissionsDto,
  AnonymizedReview,
  ApiResponse,
} from '../../types/api.types';

export const submissionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all submissions with filters and pagination
    getSubmissions: builder.query<
      ApiResponse<Submission[]>,
      QuerySubmissionsDto | void
    >({
      query: (params = {}) => ({
        url: '/submissions',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Submission' as const, id })),
              { type: 'Submission', id: 'LIST' },
            ]
          : [{ type: 'Submission', id: 'LIST' }],
    }),
    // Get my submissions
    getMySubmissions: builder.query<ApiResponse<Submission[]>, void>({
      query: () => '/submissions/me',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Submission' as const, id })),
              { type: 'Submission', id: 'MY_LIST' },
            ]
          : [{ type: 'Submission', id: 'MY_LIST' }],
    }),
    // Get submission by ID
    getSubmissionById: builder.query<ApiResponse<Submission>, string>({
      query: (id) => `/submissions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Submission', id }],
    }),
    // Create submission (with file upload)
    createSubmission: builder.mutation<ApiResponse<Submission>, FormData>({
      query: (formData) => ({
        url: '/submissions',
        method: 'POST',
        body: formData,
        // Don't set Content-Type, let browser set it with boundary for multipart/form-data
      }),
      invalidatesTags: [
        { type: 'Submission', id: 'LIST' },
        { type: 'Submission', id: 'MY_LIST' },
      ],
    }),
    // Update submission
    updateSubmission: builder.mutation<
      ApiResponse<Submission>,
      { id: string; data: UpdateSubmissionDto; file?: File }
    >({
      query: ({ id, data, file }) => {
        const formData = new FormData();
        if (file) {
          formData.append('file', file);
        }
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        return {
          url: `/submissions/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Submission', id },
        { type: 'Submission', id: 'LIST' },
        { type: 'Submission', id: 'MY_LIST' },
      ],
    }),
    // Withdraw submission
    withdrawSubmission: builder.mutation<ApiResponse<Submission>, string>({
      query: (id) => ({
        url: `/submissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Submission', id },
        { type: 'Submission', id: 'LIST' },
        { type: 'Submission', id: 'MY_LIST' },
      ],
    }),
    // Update submission status (Chair/Admin only)
    updateSubmissionStatus: builder.mutation<
      ApiResponse<Submission>,
      { id: string; data: UpdateStatusDto }
    >({
      query: ({ id, data }) => ({
        url: `/submissions/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Submission', id },
        { type: 'Submission', id: 'LIST' },
      ],
    }),
    // Upload camera-ready file
    uploadCameraReady: builder.mutation<
      ApiResponse<Submission>,
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/submissions/${id}/camera-ready`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Submission', id },
        { type: 'Submission', id: 'LIST' },
        { type: 'Submission', id: 'MY_LIST' },
      ],
    }),
    // Get anonymized reviews for author
    getAnonymizedReviews: builder.query<
      ApiResponse<AnonymizedReview[]>,
      string
    >({
      query: (id) => `/submissions/${id}/reviews`,
      providesTags: (_result, _error, id) => [
        { type: 'Review', id: `submission-${id}` },
      ],
    }),
  }),
});

export const {
  useGetSubmissionsQuery,
  useGetMySubmissionsQuery,
  useGetSubmissionByIdQuery,
  useCreateSubmissionMutation,
  useUpdateSubmissionMutation,
  useWithdrawSubmissionMutation,
  useUpdateSubmissionStatusMutation,
  useUploadCameraReadyMutation,
  useGetAnonymizedReviewsQuery,
} = submissionsApi;

