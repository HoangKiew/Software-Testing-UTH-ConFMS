// Minimal Submission interface for Conference Service
// This avoids importing the full entity from Submission Service
export interface ISubmission {
    id: number;
    conference_id: string;
    title: string;
    abstract?: string;
    status: string;
    created_by: number;
    created_at: Date;
    updated_at?: Date;
    withdrawn_at?: Date;
}
