export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
  },
  // Conferences
  CONFERENCES: {
    BASE: '/conferences',
    BY_ID: (id: number) => `/conferences/${id}`,
    TRACKS: (id: number) => `/conferences/${id}/tracks`,
    TRACK_BY_ID: (conferenceId: number, trackId: number) => `/conferences/${conferenceId}/tracks/${trackId}`,
    CFP_CHECK_DEADLINE: (id: number) => `/conferences/${id}/cfp/check-deadline`,
  },
  // Submissions
  SUBMISSIONS: {
    BASE: '/submissions',
    BY_ID: (id: string) => `/submissions/${id}`,
    ME: '/submissions/me',
    WITHDRAW: (id: string) => `/submissions/${id}`,
    UPDATE_STATUS: (id: string) => `/submissions/${id}/status`,
    CAMERA_READY: (id: string) => `/submissions/${id}/camera-ready`,
    REVIEWS: (id: string) => `/submissions/${id}/reviews`,
  },
  // Reviews
  REVIEWS: {
    BASE: '/reviews',
    BY_ID: (id: number) => `/reviews/${id}`,
    ASSIGNMENTS: '/reviews/assignments/me',
    SUBMISSION_ANONYMIZED: (submissionId: string) => `/reviews/submission/${submissionId}/anonymized`,
  },
} as const;


