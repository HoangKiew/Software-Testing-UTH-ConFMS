// src/redux/api/usersApi.ts
import { apiSlice } from './apiSlice';
import type { User } from '../../types/api.types'; // Giả sử bạn có type User

// Các DTO / Request interfaces (giữ nguyên)
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'CHAIR' | 'AUTHOR' | 'REVIEWER' | 'PC_MEMBER';
}

export interface UpdateUserRolesRequest {
  role: 'ADMIN' | 'CHAIR' | 'AUTHOR' | 'REVIEWER' | 'PC_MEMBER';
}

// Type cho search params (keyword tìm kiếm)
export interface SearchUsersParams {
  q?: string;           // keyword tìm kiếm (tên/email)
  page?: number;
  limit?: number;
}

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Đổi mật khẩu
    changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      query: (body) => ({
        url: '/users/change-password',
        method: 'PATCH',
        body,
      }),
    }),

    // Quên mật khẩu
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/users/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    // Lấy code reset (chỉ dev/test)
    getResetCode: builder.query<
      {
        message: string;
        data: {
          email: string;
          code: string;
          expiresAt: string;
          createdAt: string;
        };
      },
      { email: string }
    >({
      query: ({ email }) => ({
        url: '/users/get-reset-code',
        method: 'GET',
        params: { email },
      }),
    }),

    // Xác thực code reset
    verifyResetCode: builder.mutation<{ message: string; valid: boolean }, VerifyResetCodeRequest>({
      query: (body) => ({
        url: '/users/verify-reset-code',
        method: 'POST',
        body,
      }),
    }),

    // Đặt lại mật khẩu
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: '/users/reset-password',
        method: 'POST',
        body,
      }),
    }),

    // Tạo user mới (Admin only)
    createUser: builder.mutation<{ message: string; user: User }, CreateUserRequest>({
      query: (body) => ({
        url: '/users/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // Cập nhật role user (Admin only)
    updateUserRoles: builder.mutation<
      { message: string; user: User },
      { userId: number; data: UpdateUserRolesRequest }
    >({
      query: ({ userId, data }) => ({
        url: `/users/${userId}/roles`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Xóa user (Admin only)
    deleteUser: builder.mutation<{ message: string }, number>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // TÌM KIẾM REVIEWER: fallback qua nhiều endpoint và lọc role REVIEWER phía client
    searchReviewers: builder.query<User[], SearchUsersParams>({
      async queryFn(params, _api, _extraOptions, baseQuery) {
        const q = params.q || undefined;
        const page = params.page || 1;
        const limit = params.limit || 20;

        const candidates = [
          // Gateway custom: /api/reviewers → identity /api/users?... (nếu tồn tại)
          { url: 'reviewers', params: { q, page, limit } },
          // Một số triển khai có /users/search
          { url: '/users/search', params: { role: 'REVIEWER', q, page, limit } },
          // Fallback chung: /users
          { url: '/users', params: { role: 'REVIEWER', q, page, limit } },
        ];

        const normalize = (payload: any): any[] => {
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.users)) return payload.users;
          if (Array.isArray(payload?.data)) return payload.data;
          return [];
        };

        const isReviewer = (u: any): boolean => {
          if (!u) return false;
          if (u.role === 'REVIEWER') return true;
          if (Array.isArray(u.roles)) {
            return u.roles.some((r: any) => (typeof r === 'string' ? r : r?.name) === 'REVIEWER');
          }
          return false;
        };

        let lastError: any = null;
        for (const c of candidates) {
          const res = await baseQuery({ url: c.url, params: c.params });
          if (!res.error) {
            const list = normalize(res.data);
            const filtered = list.filter(isReviewer);
            // Nếu có keyword q, lọc tiếp theo tên/email (client-side)
            const keyword = (q || '').toLowerCase();
            const finalData = keyword
              ? filtered.filter(
                (u: any) =>
                  String(u.name || u.fullName || '').toLowerCase().includes(keyword) ||
                  String(u.email || '').toLowerCase().includes(keyword),
              )
              : filtered;
            return { data: finalData as User[] };
          }
          lastError = res.error;
        }

        return {
          error: {
            status: lastError?.status || 404,
            data: { message: 'Không tìm thấy endpoint người dùng phù hợp để tìm reviewer' },
          } as any,
        };
      },
      providesTags: ['User'],
    }),
  }),
});

export const {
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useGetResetCodeQuery,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
  useCreateUserMutation,
  useUpdateUserRolesMutation,
  useDeleteUserMutation,
  useSearchReviewersQuery,            // Hook để search reviewer
  useLazySearchReviewersQuery,        // Lazy version nếu cần gọi thủ công
} = usersApi;