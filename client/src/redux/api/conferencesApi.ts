import { apiSlice } from './apiSlice';
import type {
  Conference,
  Track,
  ApiResponse,
} from '../../types/api.types';

export const conferencesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all conferences
    getConferences: builder.query<ApiResponse<Conference[]>, void>({
      query: () => '/conferences',
      providesTags: (result) =>
        result
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
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Track' as const, id })),
              { type: 'Track', id: `conference-${conferenceId}` },
            ]
          : [{ type: 'Track', id: `conference-${conferenceId}` }],
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
        url: `/conferences/${conferenceId}/cfp/check-deadline`,
        params: { type },
      }),
    }),
  }),
});

export const {
  useGetConferencesQuery,
  useGetConferenceByIdQuery,
  useGetTracksQuery,
  useGetTrackByIdQuery,
  useCheckDeadlineQuery,
} = conferencesApi;

