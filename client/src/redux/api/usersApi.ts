import { apiSlice } from './apiSlice';
import type { User } from '../../types/api.types';

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

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    changePassword: builder.mutation<
      { message: string },
      ChangePasswordRequest
    >({
      query: (body) => ({
        url: '/users/change-password',
        method: 'PATCH',
        body,
      }),
    }),
    
    // Forgot password
    forgotPassword: builder.mutation<
      { message: string },
      ForgotPasswordRequest
    >({
      query: (body) => ({
        url: '/users/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    
    // Get reset code (Dev only)
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
    
    // Verify reset code
    verifyResetCode: builder.mutation<
      { message: string; valid: boolean },
      VerifyResetCodeRequest
    >({
      query: (body) => ({
        url: '/users/verify-reset-code',
        method: 'POST',
        body,
      }),
    }),
    
    // Reset password
    resetPassword: builder.mutation<
      { message: string },
      ResetPasswordRequest
    >({
      query: (body) => ({
        url: '/users/reset-password',
        method: 'POST',
        body,
      }),
    }),
    
    // Create user (Admin only)
    createUser: builder.mutation<
      { message: string; data: User },
      CreateUserRequest
    >({
      query: (body) => ({
        url: '/users/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    
    // Update user roles (Admin only)
    updateUserRoles: builder.mutation<
      { message: string; data: User },
      { userId: number; data: UpdateUserRolesRequest }
    >({
      query: ({ userId, data }) => ({
        url: `/users/${userId}/roles`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
      ],
    }),
    
    // Delete user (Admin only)
    deleteUser: builder.mutation<
      { message: string },
      number
    >({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Get all users (Admin only)
    getUsers: builder.query<
      { message: string; data: User[] },
      void
    >({
      query: () => '/users',
      providesTags: (result) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // Get user by ID (Admin only)
    getUserById: builder.query<
      { message: string; data: User },
      number
    >({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
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
  useGetUsersQuery,
  useGetUserByIdQuery,
} = usersApi;

