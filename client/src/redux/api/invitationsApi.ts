// src/redux/api/invitationsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Thống nhất shape dữ liệu cho PCMembers: Invitation + Reviewer info tối thiểu
interface AcceptedReviewer {
    invitationId: string;
    userId: number;
    acceptedAt?: string;
    topics?: string[];
    name?: string;
    email?: string;
}

// Type cho body invite (khớp InviteReviewerDto)
interface InviteReviewerBody {
    conferenceId: string;
    userId: number;
    email?: string; // NEW
    name?: string;  // NEW
}

const API_BASE_URL =
    (import.meta as any)?.env?.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:3000/api`;

export const invitationsApi = createApi({
    reducerPath: 'invitationsApi',

    // Proxy Vite '/api' → forward đến gateway http://localhost:3000/api/...
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL, // ← dùng gateway
        prepareHeaders: (headers) => {
            const token =
                localStorage.getItem('token') ||
                localStorage.getItem('accessToken') ||
                localStorage.getItem('jwt') ||
                localStorage.getItem('authToken');
            if (token) headers.set('Authorization', `Bearer ${token}`);
            headers.set('Accept', 'application/json');
            return headers;
        },
        timeout: 15000, // Tăng timeout tránh lỗi chậm
    }),

    tagTypes: ['AcceptedReviewers'], // Tag để invalidate khi invite/remove

    endpoints: (builder) => ({
        // Chair mời reviewer (POST /api/invitations/invite)
        inviteReviewer: builder.mutation<void, InviteReviewerBody>({
            query: (body) => ({
                url: 'invitations/invite',       // → /api/invitations/invite
                method: 'POST',
                body,
            }),
            invalidatesTags: ['AcceptedReviewers'], // Reload danh sách accepted sau invite
        }),

        // Chair xem danh sách reviewer đã chấp nhận (GET /api/invitations/conference/:id/accepted)
        getAcceptedReviewers: builder.query<AcceptedReviewer[], string>({
            query: (conferenceId) => `invitations/conference/${conferenceId}/accepted`,
            transformResponse: (raw: any): AcceptedReviewer[] => {
                const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                return list.map((item: any) => {
                    const invitationId =
                        item.invitationId ??
                        item.id ??
                        item.invitation?.id ??
                        item.uuid ??
                        item._id ??
                        '';

                    const userId =
                        item.userId ??
                        item.user?.id ??
                        item.reviewerId ??
                        item.reviewer?.id ??
                        item.acceptedBy?.id ??
                        undefined;

                    const acceptedAt =
                        item.acceptedAt ??
                        item.accept_time ??
                        item.updatedAt ??
                        item.createdAt ??
                        undefined;

                    const topicsRaw =
                        item.topics ??
                        item.expertise ??
                        item.subjects ??
                        item.fields ??
                        item.reviewTopics ??
                        [];

                    const topics = Array.isArray(topicsRaw)
                        ? topicsRaw.map((t: any) => String(t))
                        : typeof topicsRaw === 'string'
                            ? topicsRaw.split(',').map((t: string) => t.trim())
                            : [];

                    const name =
                        item.name ??
                        item.fullName ??
                        item.user?.fullName ??
                        item.user?.name ??
                        item.reviewer?.name ??
                        undefined;

                    const email =
                        item.email ??
                        item.user?.email ??
                        item.reviewer?.email ??
                        undefined;

                    return {
                        invitationId: String(invitationId || ''),
                        userId: typeof userId === 'number' ? userId : Number(userId ?? 0),
                        acceptedAt: acceptedAt ? String(acceptedAt) : undefined,
                        topics,
                        name,
                        email,
                    };
                });
            },
            providesTags: ['AcceptedReviewers'],
        }),

        // Chair xóa lời mời hoặc reviewer (DELETE /api/invitations/:id)
        removeInvitation: builder.mutation<void, string>({
            query: (invitationId) => ({
                url: `invitations/${invitationId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AcceptedReviewers'], // Reload danh sách sau xóa
        }),
    }),
});

// Export hooks
export const {
    useInviteReviewerMutation,
    useGetAcceptedReviewersQuery,
    useLazyGetAcceptedReviewersQuery, // Nếu cần load thủ công
    useRemoveInvitationMutation,
} = invitationsApi;