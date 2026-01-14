// src/redux/api/apiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`;

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL, // ← trỏ thẳng gateway (:3000) hoặc VITE_API_BASE_URL nếu có
  prepareHeaders: (headers) => {
    // Thử lấy token từ nhiều key phổ biến (để fix lỗi key sai)
    const token = localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('authToken');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('Token được gửi:', token.substring(0, 20) + '...'); // Debug: in token đầu để check
    } else {
      console.warn('Không tìm thấy token trong Local Storage');
    }

    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  // Bỏ qua refresh cho các request auth (tránh loop vô hạn)
  const isAuthRequest =
    typeof args === 'object' &&
    (args.url?.includes('/auth/login') ||
      args.url?.includes('/auth/refresh-token'));

  if (result.error && result.error.status === 401 && !isAuthRequest) {
    console.warn('401 Unauthorized → Thử refresh token...');

    const refreshToken = localStorage.getItem('refreshToken');

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
          if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

          console.log('Refresh token thành công → thử lại request gốc');

          // Thử lại request ban đầu với token mới
          result = await baseQuery(args, api, extraOptions);
        } else {
          console.error('Refresh token thất bại');
          logoutAndRedirect();
        }
      } catch (error) {
        console.error('Lỗi refresh token:', error);
        logoutAndRedirect();
      }
    } else {
      console.warn('Không có refreshToken → logout');
      logoutAndRedirect();
    }
  }

  return result;
};

// Hàm logout chung
const logoutAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,

  tagTypes: [
    'User',
    'Conference',
    'Track',
    'Submission',
    'Review',
    'Assignment',
    'Invitation',
    'AcceptedReviewers',
  ],

  endpoints: () => ({}),
});