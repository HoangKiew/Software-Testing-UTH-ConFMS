import type { ApiError } from '../types/api.types';

/**
 * Format API error message for display
 * Handles RTK Query error structure: error.data.message
 */
export const formatApiError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred';
  }

  // RTK Query error structure: error.data.message
  // Check for error.data (RTK Query wraps API response in data)
  if ('data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      // Check for nested message in data
      if ('message' in data && typeof data.message === 'string') {
        return data.message;
      }
      // Check if data itself is ApiError
      if ('message' in data && typeof (data as ApiError).message === 'string') {
        return (data as ApiError).message;
      }
    }
  }

  // Direct error.message (fallback)
  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }

  // Check for error.error.data.message (nested structure)
  if ('error' in error) {
    const nestedError = (error as { error?: unknown }).error;
    if (nestedError && typeof nestedError === 'object' && 'data' in nestedError) {
      const nestedData = (nestedError as { data?: unknown }).data;
      if (nestedData && typeof nestedData === 'object' && 'message' in nestedData) {
        const message = (nestedData as { message?: unknown }).message;
        if (typeof message === 'string') {
          return message;
        }
      }
    }
  }

  return 'An unexpected error occurred';
};

/**
 * Check if error is an API error
 */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    'message' in error
  );
};

/**
 * Create FormData for file upload with submission data
 */
export const createSubmissionFormData = (
  data: {
    title: string;
    abstract: string;
    keywords?: string;
    trackId: number;
    conferenceId: number;
  },
  file: File
): FormData => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', data.title);
  formData.append('abstract', data.abstract);
  if (data.keywords) {
    formData.append('keywords', data.keywords);
  }
  formData.append('trackId', data.trackId.toString());
  formData.append('conferenceId', data.conferenceId.toString());
  return formData;
};

