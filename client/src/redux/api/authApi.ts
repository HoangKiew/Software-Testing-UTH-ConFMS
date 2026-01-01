import { apiSlice } from './apiSlice';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
} from '../../types/api.types';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<{ message: string; data: User }, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query<{ message: string; user: User }, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    logout: builder.mutation<
      { message: string },
      { refreshToken: string }
    >({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    verifyEmail: builder.mutation<
      { message: string },
      { token: string }
    >({
      query: ({ token }) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: { token },
      }),
      invalidatesTags: ['User'],
    }),
    getVerificationToken: builder.query<
      {
        message: string;
        data: {
          email: string;
          code: string;
          expiresAt: string;
          createdAt: string;
          isVerified: boolean;
        };
      },
      { email: string }
    >({
      query: ({ email }) => ({
        url: '/auth/get-verification-token',
        method: 'GET',
        params: { email },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useLogoutMutation,
  useVerifyEmailMutation,
  useGetVerificationTokenQuery,
} = authApi;

