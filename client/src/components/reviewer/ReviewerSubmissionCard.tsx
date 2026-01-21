import { memo } from 'react';
import type { Submission, ReviewAssignment } from '../../types/api.types';

interface ReviewerSubmissionCardProps {
  submission: Submission;
  assignment: ReviewAssignment;
  trackConferenceId: number;
  onEvaluate: (submissionId: string, assignmentId: number) => void;
  onSelfAssign: (submissionId: string, conferenceId: number) => Promise<void>;
  onAcceptAssignment: (assignmentId: number) => Promise<void>;
  isRealAssignment: boolean;
}

const ReviewerSubmissionCard = memo(({
  submission,
  assignment,
  trackConferenceId,
  onEvaluate,
  onSelfAssign,
  onAcceptAssignment,
  isRealAssignment,
}: ReviewerSubmissionCardProps) => {
  const status = assignment.status === 'ACCEPTED' 
    ? 'Đã phân công' 
    : assignment.status === 'PENDING' 
    ? 'Chờ chấp nhận' 
    : assignment.status === 'COMPLETED'
    ? 'Đã hoàn thành'
    : 'Chưa phân công';
  
  const statusClass = assignment.status === 'ACCEPTED'
    ? 'bg-green-600 text-white'
    : assignment.status === 'PENDING'
    ? 'bg-yellow-500 text-white'
    : assignment.status === 'COMPLETED'
    ? 'bg-blue-600 text-white'
    : 'bg-gray-200 text-gray-700';

  const handleEvaluate = async () => {
    let assignmentId = assignment.id;
    
    // If no assignment or invalid assignment, self-assign first
    if (!assignmentId || assignmentId === 0 || !isRealAssignment) {
      await onSelfAssign(submission.id, trackConferenceId);
      return;
    }
    
    // If assignment exists but is PENDING, auto-accept it
    if (assignment.status === 'PENDING') {
      await onAcceptAssignment(assignmentId);
    }
    
    // Now proceed to evaluate
    if (assignmentId && assignmentId > 0) {
      onEvaluate(submission.id, assignmentId);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs rounded ${statusClass}`}>
              {status}
            </span>
          </div>
          <h4 className="text-base font-semibold text-gray-800 mb-1">
            {submission.title}
          </h4>
          <p className="text-lg text-black mb-2">
            Tác giả: {submission.authorName || 'N/A'}
          </p>
          {submission.keywords && (
            <div className="flex flex-wrap gap-2 mt-2">
              {submission.keywords.split(',').slice(0, 3).map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-teal-600 text-white font-semibold rounded"
                >
                  {keyword.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          {assignment.status === 'COMPLETED' ? (
            <button
              onClick={() => {
                if (assignment.id && assignment.id > 0) {
                  onEvaluate(submission.id, assignment.id);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem đánh giá
            </button>
          ) : (
            <button
              onClick={handleEvaluate}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Đánh giá
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ReviewerSubmissionCard.displayName = 'ReviewerSubmissionCard';

export default ReviewerSubmissionCard;

