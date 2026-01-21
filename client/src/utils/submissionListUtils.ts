import type { SubmissionStatus } from '../types/api.types';

export const getStatusLabel = (status: SubmissionStatus): string => {
  const statusMap: Record<SubmissionStatus, string> = {
    DRAFT: 'Bản nháp',
    SUBMITTED: 'Đã nộp',
    REVIEWING: 'Đang phản biện',
    ACCEPTED: 'Đã chấp nhận',
    REJECTED: 'Đã từ chối',
    WITHDRAWN: 'Đã rút',
    CAMERA_READY: 'Đã nộp bản cuối',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: SubmissionStatus): string => {
  const colorMap: Record<SubmissionStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    REVIEWING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    WITHDRAWN: 'bg-gray-100 text-gray-700',
    CAMERA_READY: 'bg-teal-100 text-teal-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

