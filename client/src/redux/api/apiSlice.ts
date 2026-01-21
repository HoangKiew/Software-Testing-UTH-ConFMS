import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../utils/constants';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const isLoginRequest = typeof args === 'object' && args.url === '/auth/login';
  const isLogoutRequest = typeof args === 'object' && args.url === '/auth/logout';
  const isPublicRequest = typeof args === 'object' && 
    (args.url?.startsWith('/public/') || 
     args.url?.startsWith('/auth/verify-email') || 
     args.url?.startsWith('/auth/get-verification-token') ||
     args.url?.startsWith('/users/forgot-password') ||
     args.url?.startsWith('/users/verify-reset-code') ||
     args.url?.startsWith('/users/reset-password') ||
     args.url?.startsWith('/users/get-reset-code'));
  if (!isLoginRequest && !isLogoutRequest && !isPublicRequest) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return { 
        error: { 
          status: 'FETCH_ERROR', 
          error: 'No token available - request skipped after logout',
          data: { message: 'Authentication required' }
        } 
      };
    }
  }

  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && !isLoginRequest && !isLogoutRequest) {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh-token',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const { accessToken, refreshToken: newRefreshToken } = refreshResult.data as {
            accessToken: string;
            refreshToken: string;
          };
          localStorage.setItem('accessToken', accessToken);
          sessionStorage.setItem('refreshToken', newRefreshToken);

          result = await baseQuery(args, api, extraOptions);
        } else {
          localStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    } else {
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Conference',
    'Track',
    'TrackMember',
    'Submission',
    'Review',
    'Assignment',
  ],
  endpoints: () => ({}),
});

