// src/redux/api/assignmentsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Định nghĩa type cho response từ suggestReviewersForTopic (dựa trên backend trả về)
interface SuggestedReviewer {
    reviewerId: number;
    name: string;
    email?: string;
    score: number;
    expertise: string[];
    // Có thể thêm các field khác nếu backend trả về (assignedTopics, maxTopics, etc.)
}

// Định nghĩa type cho assignment item (từ getAssignmentsByConference)
interface Assignment {
    topic: string;
    reviewers: { id: number; name: string; email?: string }[];
    // Thêm field khác nếu backend trả về
}

// Thống nhất base URL với các API khác (qua gateway)
const API_BASE_URL =
    (import.meta as any)?.env?.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:3000/api`;

export const assignmentsApi = createApi({
    reducerPath: 'assignmentsApi',

    // Dùng gateway http://host:3000/api/...
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL,
        prepareHeaders: (headers) => {
            const token =
                localStorage.getItem('token') ||
                localStorage.getItem('accessToken') ||
                localStorage.getItem('jwt') ||
                localStorage.getItem('authToken');

            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            headers.set('Accept', 'application/json');
            return headers;
        },
        // Tùy chọn: timeout dài hơn nếu API conference chậm
        timeout: 15000,
    }),

    tagTypes: ['ConferenceAssignments'],

    endpoints: (builder) => ({
        // Lấy tất cả phân công reviewer theo topic của một conference
        getAssignmentsByConference: builder.query<Assignment[], string>({
            query: (conferenceId) => `assignments/conference/${conferenceId}`,
            providesTags: ['ConferenceAssignments'],
        }),

        // Gợi ý reviewer phù hợp nhất cho một topic
        suggestReviewersForTopic: builder.query<SuggestedReviewer[], { conferenceId: string; topic: string; top?: number }>({
            query: ({ conferenceId, topic, top = 5 }) =>
                `assignments/suggest/${conferenceId}/${encodeURIComponent(topic)}?top=${top}`,
            // Không cần providesTags vì đây là query gợi ý, không cần invalidate
        }),

        // Phân công (assign) một hoặc nhiều reviewer cho topic
        assignReviewersToTopic: builder.mutation<void, { conferenceId: string; topic: string; reviewerIds: number[] }>({
            query: (body) => ({
                url: 'assignments/assign',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ConferenceAssignments'], // Reload danh sách assignments sau khi assign
        }),

        // Hủy phân công (unassign) một assignment cụ thể
        unassign: builder.mutation<void, string>({
            query: (assignmentId) => ({
                url: `assignments/${assignmentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ConferenceAssignments'], // Reload danh sách sau khi unassign
        }),
    }),
});

// Export hooks tự động
export const {
    useGetAssignmentsByConferenceQuery,
    useSuggestReviewersForTopicQuery,
    useLazySuggestReviewersForTopicQuery, // nếu cần lazy query
    useAssignReviewersToTopicMutation,
    useUnassignMutation,
} = assignmentsApi;