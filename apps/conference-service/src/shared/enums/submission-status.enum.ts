// Shared enum for Submission Status
// Used by both Conference Service and Submission Service
export enum SubmissionStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    WITHDRAWN = 'WITHDRAWN',
    REVISION_REQUIRED = 'REVISION_REQUIRED',
}
