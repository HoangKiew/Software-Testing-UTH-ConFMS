import { useState, useMemo, useCallback } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { 
  useGetMyAssignmentsQuery, 
  useSelfAssignSubmissionMutation,
  useGetSubmissionsForReviewerQuery,
  useAcceptAssignmentMutation,
} from '../../redux/api/reviewsApi';
import type { TrackMember, Submission, ReviewAssignment } from '../../types/api.types';
import { SubmissionStatus } from '../../types/api.types';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';
import { tokenUtils } from '../../utils/token';
import TrackHeader from '../../components/reviewer/TrackHeader';
import ReviewerSubmissionCard from '../../components/reviewer/ReviewerSubmissionCard';

interface TrackSubmissionsViewProps {
  trackAssignment: TrackMember;
  onEvaluate: (submissionId: string, assignmentId: number) => void;
}
const TrackSubmissionsView = ({ trackAssignment, onEvaluate }: TrackSubmissionsViewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const track = trackAssignment.track;
  const hasToken = tokenUtils.hasToken();
  
  const { data: submissionsData, isLoading: submissionsLoading } = useGetSubmissionsForReviewerQuery(
    isExpanded && track
      ? {
          status: [SubmissionStatus.SUBMITTED, SubmissionStatus.REVIEWING],
        }
      : undefined,
    { skip: !isExpanded || !track || !hasToken }
  );
  const allSubmissions: Submission[] = submissionsData?.data || [];
  const submissions = allSubmissions.filter(
    (submission) => {
      const submissionTrackId = typeof submission.trackId === 'string' 
        ? parseInt(submission.trackId, 10) 
        : submission.trackId;
      const currentTrackId = typeof track?.id === 'string' 
        ? parseInt(track.id, 10) 
        : track?.id;
      return submissionTrackId === currentTrackId;
    }
  );

  const { data: assignmentsData, refetch: refetchAssignments } = useGetMyAssignmentsQuery(undefined, {
    skip: !hasToken,
  });
  const [selfAssignSubmission] = useSelfAssignSubmissionMutation();
  const [acceptAssignment] = useAcceptAssignmentMutation();
  const assignments: ReviewAssignment[] = assignmentsData?.data || [];

  // Create mapping of submissionId to assignment (memoized)
  const submissionToAssignmentMap = useMemo(() => {
    const map = new Map<string, ReviewAssignment>();
    assignments.forEach((assignment) => {
      const submissionId = String(assignment.submissionId);
      map.set(submissionId, assignment);
    });
    return map;
  }, [assignments]);

  
  // Filter: only show SUBMITTED and REVIEWING for reviewer to evaluate
  const visibleSubmissions = submissions.filter(
    (submission) => 
      submission.status === SubmissionStatus.SUBMITTED || 
      submission.status === SubmissionStatus.REVIEWING
  );
  
  // Convert submissions to assignments format
  const submissionsWithAssignments = visibleSubmissions.map((submission) => {
    const existingAssignment = submissionToAssignmentMap.get(submission.id);
    if (existingAssignment) {
      return existingAssignment;
    }
    // Create a mock assignment for submissions without review assignment
    // Must include all required properties from ReviewAssignment interface
    return {
      id: parseInt(submission.id.replace(/-/g, '').substring(0, 10)) || 0, // Generate a temporary ID
      submissionId: submission.id,
      reviewerId: 0,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(), // Required property
      submission: submission,
      trackId: submission.trackId,
      conferenceId: submission.conferenceId,
    } as ReviewAssignment;
  });

  if (!track) {
    return null;
  }

  const handleSelfAssign = useCallback(async (submissionId: string, conferenceId: number) => {
    if (!track || !track.conferenceId) {
      showToast.error('Không thể xác định conference');
      return;
    }
    
    try {
      await selfAssignSubmission({
        submissionId,
        conferenceId: track.conferenceId,
      }).unwrap();
      refetchAssignments();
      showToast.success('Đã tự phân công bài này');
    } catch (error) {
      showToast.error(formatApiError(error));
      throw error;
    }
  }, [track, selfAssignSubmission, refetchAssignments]);

  const handleAcceptAssignment = useCallback(async (assignmentId: number) => {
    try {
      await acceptAssignment(assignmentId).unwrap();
      refetchAssignments();
      showToast.success('Đã chấp nhận phân công');
    } catch (error) {
      showToast.error(formatApiError(error));
      throw error;
    }
  }, [acceptAssignment, refetchAssignments]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <TrackHeader
        trackAssignment={trackAssignment}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <div className="mt-4">
          {submissionsLoading ? (
            <div className="flex justify-center items-center py-8">
              <CircularProgress size={24} disableShrink />
            </div>
          ) : submissionsWithAssignments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Chưa có bài nộp nào cần đánh giá trong chủ đề này
              {submissions.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  (Có {submissions.length} bài nhưng đã được quyết định hoặc chưa nộp)
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {submissionsWithAssignments.map((assignment) => {
                const submission = assignment.submission || submissions.find(s => s.id === assignment.submissionId);
                if (!submission) return null;

                return (
                  <ReviewerSubmissionCard
                    key={submission.id}
                    submission={submission}
                    assignment={assignment}
                    trackConferenceId={track?.conferenceId || submission.conferenceId}
                    onEvaluate={onEvaluate}
                    onSelfAssign={handleSelfAssign}
                    onAcceptAssignment={handleAcceptAssignment}
                    isRealAssignment={submissionToAssignmentMap.has(submission.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackSubmissionsView;

