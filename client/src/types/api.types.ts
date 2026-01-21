// Common API Response Types
export interface ApiResponse<T = unknown> {
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// JWT Payload
export interface JwtPayload {
  sub: number; // user ID
  email: string;
  fullName?: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName?: string;
    roles: string[];
  };
  expiresIn?: string;
  refreshExpiresIn?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  message?: string;
  accessToken: string;
  refreshToken: string;
  user?: {
    id: number;
    email: string;
    fullName?: string;
    roles: string[];
  };
  expiresIn?: string;
  refreshExpiresIn?: string;
}

// User Types
export interface User {
  id: number;
  email: string;
  fullName?: string;
  roles: string[];
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Conference Types
export interface CfpSetting {
  id: number;
  submissionDeadline: string;
  reviewDeadline: string;
  notificationDate: string;
  cameraReadyDeadline: string;
  conferenceId: number;
}

export interface Conference {
  id: number;
  name: string;
  description?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  submissionDeadline?: string;
  reviewDeadline?: string;
  cameraReadyDeadline?: string;
  notificationDate?: string;
  shortDescription?: string;
  contactEmail?: string;
  cfpSetting?: CfpSetting | null;
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: number;
  conferenceId: number;
  name: string;
  description?: string;
  conference?: Conference;
  createdAt: string;
  updatedAt: string;
}

export interface TrackMember {
  id: number;
  trackId: number;
  userId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  track?: Track;
  createdAt: string;
  updatedAt: string;
}

// Submission Types
export const SubmissionStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  REVIEWING: 'REVIEWING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  CAMERA_READY: 'CAMERA_READY',
} as const;

export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus];

export interface Submission {
  id: string;
  title: string;
  abstract: string;
  keywords?: string;
  fileUrl: string;
  cameraReadyFileUrl?: string;
  status: SubmissionStatus;
  authorId: number;
  authorName?: string;
  authorAffiliation?: string;
  trackId: number;
  conferenceId: number;
  coAuthors?: Array<{ name: string; email: string; affiliation?: string }>;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  versions?: SubmissionVersion[];
}

export interface SubmissionVersion {
  id: string;
  submissionId: string;
  versionNumber: number;
  title: string;
  abstract: string;
  fileUrl: string;
  keywords?: string;
  createdAt: string;
}

export interface CreateSubmissionDto {
  title: string;
  abstract: string;
  keywords?: string;
  trackId: number;
  conferenceId: number;
}

export interface UpdateSubmissionDto {
  title?: string;
  abstract?: string;
  keywords?: string;
  trackId?: number;
  authorAffiliation?: string;
  coAuthors?: string;
}

export interface UpdateStatusDto {
  status: SubmissionStatus;
  decisionNote?: string;
}

export interface QuerySubmissionsDto extends PaginationParams {
  trackId?: number;
  conferenceId?: number;
  status?: SubmissionStatus;
  authorId?: number;
  search?: string;
}

// Review Types
export interface Review {
  id: number;
  assignmentId: number;
  submissionId: string;
  reviewerId: number;
  reviewerName?: string; // Enriched by backend from identity service
  score: number;
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  commentForAuthor: string;
  commentForPC?: string;
  commentForChair?: string;
  recommendation: 'ACCEPT' | 'WEAK_ACCEPT' | 'REJECT' | 'WEAK_REJECT';
  createdAt: string;
  updatedAt: string;
}

export interface AnonymizedReview {
  score: number;
  commentForAuthor: string;
  recommendation: string;
}

export interface ReviewAssignment {
  id: number;
  submissionId: string;
  reviewerId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  submission?: Submission;
  conferenceId?: number;
  trackId?: number;
  dueDate?: string;
}

