import type { SubmissionStatus } from '../types/api.types';

export const getStatusColor = (status: SubmissionStatus): string => {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'WITHDRAWN':
      return 'bg-gray-100 text-gray-600 border border-gray-200';
    case 'REVIEWING':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

export const getStatusLabel = (status: SubmissionStatus): string => {
  switch (status) {
    case 'SUBMITTED':
      return 'Đã nộp';
    case 'WITHDRAWN':
      return 'Đã rút';
    case 'REVIEWING':
      return 'Chờ duyệt';
    default:
      return status;
  }
};

export const formatSubmissionDate = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
