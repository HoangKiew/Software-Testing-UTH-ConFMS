import { createHash } from 'crypto';

/**
 * Generate a hash for submission ID (useful for public URLs or tracking)
 */
export function hashSubmissionId(submissionId: number, salt?: string): string {
  const data = `${submissionId}${salt || 'UTH_CONFMS_SALT'}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Generate a unique token for submission
 */
export function generateSubmissionToken(submissionId: number, userId: number): string {
  const timestamp = Date.now();
  const data = `${submissionId}-${userId}-${timestamp}`;
  return createHash('sha256').update(data).digest('hex');
}
