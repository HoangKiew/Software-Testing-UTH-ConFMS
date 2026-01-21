import { apiSlice } from './apiSlice';
import type {
  Conference,
  Track,
  TrackMember,
  ApiResponse,
} from '../../types/api.types';

export const conferencesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all conferences
    getConferences: builder.query<ApiResponse<Conference[]>, void>({
      query: () => '/conferences',
      providesTags: (result) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({ type: 'Conference' as const, id })),
              { type: 'Conference', id: 'LIST' },
            ]
          : [{ type: 'Conference', id: 'LIST' }],
    }),
    // Get conference by ID
    getConferenceById: builder.query<ApiResponse<Conference>, number>({
      query: (id) => `/conferences/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Conference', id }],
    }),
    // Get tracks for a conference
    getTracks: builder.query<ApiResponse<Track[]>, number>({
      query: (conferenceId) => `/conferences/${conferenceId}/tracks`,
      providesTags: (result, _error, conferenceId) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({ type: 'Track' as const, id })),
              { type: 'Track', id: `conference-${conferenceId}` },
            ]
          : [{ type: 'Track', id: `conference-${conferenceId}` }],
    }),
    // Get public tracks for a conference (no auth required)
    getPublicTracks: builder.query<ApiResponse<Track[]>, number>({
      query: (conferenceId) => `/public/conferences/${conferenceId}/tracks`,
      providesTags: (result, _error, conferenceId) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({ type: 'Track' as const, id })),
              { type: 'Track', id: `public-conference-${conferenceId}` },
            ]
          : [{ type: 'Track', id: `public-conference-${conferenceId}` }],
    }),
    // Get track by ID
    getTrackById: builder.query<
      ApiResponse<Track>,
      { conferenceId: number; trackId: number }
    >({
      query: ({ conferenceId, trackId }) =>
        `/conferences/${conferenceId}/tracks/${trackId}`,
      providesTags: (_result, _error, { trackId }) => [{ type: 'Track', id: trackId }],
    }),
    // Check deadline
    checkDeadline: builder.query<
      { valid: boolean; deadline?: string; message: string },
      { conferenceId: number; type: 'submission' | 'review' | 'notification' | 'camera-ready' }
    >({
      query: ({ conferenceId, type }) => ({
        url: `/public/conferences/${conferenceId}/cfp/check-deadline`,
        params: { type },
      }),
    }),
    // Create conference
    createConference: builder.mutation<
      ApiResponse<Conference>,
      {
        name: string;
        startDate: string;
        endDate: string;
        venue: string;
        description?: string;
        shortDescription?: string;
        contactEmail?: string;
      }
    >({
      query: (body) => ({
        url: '/conferences',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Conference', id: 'LIST' }],
    }),
    // Update conference
    updateConference: builder.mutation<
      ApiResponse<Conference>,
      {
        id: number;
        name?: string;
        startDate?: string;
        endDate?: string;
        venue?: string;
        description?: string;
        shortDescription?: string;
        contactEmail?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/conferences/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Conference', id },
        { type: 'Conference', id: 'LIST' },
      ],
    }),
    // Set CFP settings
    setCfpSettings: builder.mutation<
      ApiResponse<any>,
      {
        conferenceId: number;
        submissionDeadline: string;
        reviewDeadline: string;
        notificationDate: string;
        cameraReadyDeadline: string;
      }
    >({
      query: ({ conferenceId, ...body }) => ({
        url: `/conferences/${conferenceId}/cfp`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { conferenceId }) => [
        { type: 'Conference', id: conferenceId },
      ],
    }),
    // Delete conference
    deleteConference: builder.mutation<
      { message: string },
      number
    >({
      query: (id) => ({
        url: `/conferences/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Conference', id },
        { type: 'Conference', id: 'LIST' },
      ],
    }),
    // Create track
    createTrack: builder.mutation<
      ApiResponse<Track>,
      { conferenceId: number; name: string }
    >({
      query: ({ conferenceId, name }) => ({
        url: `/conferences/${conferenceId}/tracks`,
        method: 'POST',
        body: { name },
      }),
      invalidatesTags: (_result, _error, { conferenceId }) => [
        { type: 'Track', id: `conference-${conferenceId}` },
        { type: 'Conference', id: conferenceId },
      ],
    }),
    // Update track
    updateTrack: builder.mutation<
      ApiResponse<Track>,
      { conferenceId: number; trackId: number; name?: string }
    >({
      query: ({ conferenceId, trackId, ...body }) => ({
        url: `/conferences/${conferenceId}/tracks/${trackId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { conferenceId, trackId }) => [
        { type: 'Track', id: trackId },
        { type: 'Track', id: `conference-${conferenceId}` },
        { type: 'Conference', id: conferenceId },
      ],
    }),
    // Delete track
    deleteTrack: builder.mutation<
      { message: string },
      { conferenceId: number; trackId: number }
    >({
      query: ({ conferenceId, trackId }) => ({
        url: `/conferences/${conferenceId}/tracks/${trackId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { conferenceId, trackId }) => [
        { type: 'Track', id: trackId },
        { type: 'Track', id: `conference-${conferenceId}` },
        { type: 'Conference', id: conferenceId },
      ],
    }),
    // Get track members
    getTrackMembers: builder.query<ApiResponse<TrackMember[]>, number>({
      query: (trackId) => `/conferences/tracks/${trackId}/members`,
      providesTags: (result, _error, trackId) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({ type: 'TrackMember' as const, id })),
              { type: 'TrackMember', id: `track-${trackId}` },
            ]
          : [{ type: 'TrackMember', id: `track-${trackId}` }],
    }),
    // Add track member
    addTrackMember: builder.mutation<
      ApiResponse<TrackMember>,
      { trackId: number; userId: number }
    >({
      query: ({ trackId, userId }) => ({
        url: `/conferences/tracks/${trackId}/members`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { trackId }) => [
        { type: 'TrackMember', id: `track-${trackId}` },
      ],
    }),
    // Delete track member
    deleteTrackMember: builder.mutation<
      { message: string },
      { trackId: number; userId: number }
    >({
      query: ({ trackId, userId }) => ({
        url: `/conferences/tracks/${trackId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { trackId }) => [
        { type: 'TrackMember', id: `track-${trackId}` },
      ],
    }),
    // Get my track assignments (for reviewers)
    getMyTrackAssignments: builder.query<ApiResponse<TrackMember[]>, void>({
      query: () => '/conferences/reviewer/my-track-assignments',
      providesTags: (result) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({ type: 'TrackMember' as const, id })),
              { type: 'TrackMember', id: 'MY_ASSIGNMENTS' },
            ]
          : [{ type: 'TrackMember', id: 'MY_ASSIGNMENTS' }],
    }),
    // Accept track assignment
    acceptTrackAssignment: builder.mutation<
      ApiResponse<TrackMember>,
      number
    >({
      query: (trackId) => ({
        url: `/conferences/tracks/${trackId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, trackId) => [
        { type: 'TrackMember', id: 'MY_ASSIGNMENTS' },
        { type: 'TrackMember', id: `track-${trackId}` },
      ],
    }),
    // Reject track assignment
    rejectTrackAssignment: builder.mutation<
      ApiResponse<TrackMember>,
      number
    >({
      query: (trackId) => ({
        url: `/conferences/tracks/${trackId}/reject`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, trackId) => [
        { type: 'TrackMember', id: 'MY_ASSIGNMENTS' },
        { type: 'TrackMember', id: `track-${trackId}` },
      ],
    }),
    // Get dashboard statistics
    getDashboardStats: builder.query<
      ApiResponse<{
        totalSubmissions: number;
        totalSubmissionsChange?: number;
        acceptanceRate: number;
        acceptanceRateChange?: number;
        totalAccepted: number;
        totalRejected: number;
        totalReviewers: number;
        submissionsByTrack: Array<{
          trackId: number;
          trackName: string;
          submissions: number;
          accepted: number;
          rejected: number;
        }>;
        statusDistribution: {
          accepted: number;
          rejected: number;
          reviewing: number;
        };
      }>,
      number
    >({
      query: (conferenceId) => `/conferences/${conferenceId}/stats/dashboard`,
      providesTags: (_result, _error, conferenceId) => [
        { type: 'Conference', id: `stats-${conferenceId}` },
      ],
    }),
    // Get audit logs (activity log)
    getAuditLogs: builder.query<
      ApiResponse<Array<{
        id: number;
        userId: number;
        action: string;
        resourceType: string;
        description: string | null;
        createdAt: string;
      }>>,
      number
    >({
      query: (conferenceId) => `/conferences/${conferenceId}/audit-logs`,
      providesTags: (_result, _error, conferenceId) => [
        { type: 'Conference', id: `audit-${conferenceId}` },
      ],
    }),
  }),
});

export const {
  useGetConferencesQuery,
  useGetConferenceByIdQuery,
  useGetTracksQuery,
  useGetPublicTracksQuery,
  useGetTrackByIdQuery,
  useCheckDeadlineQuery,
  useCreateConferenceMutation,
  useUpdateConferenceMutation,
  useSetCfpSettingsMutation,
  useDeleteConferenceMutation,
  useCreateTrackMutation,
  useUpdateTrackMutation,
  useDeleteTrackMutation,
  useGetTrackMembersQuery,
  useAddTrackMemberMutation,
  useDeleteTrackMemberMutation,
  useGetMyTrackAssignmentsQuery,
  useAcceptTrackAssignmentMutation,
  useRejectTrackAssignmentMutation,
  useGetDashboardStatsQuery,
  useGetAuditLogsQuery,
} = conferencesApi;

