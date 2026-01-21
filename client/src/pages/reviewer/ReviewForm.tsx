import { useState, useEffect, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';
import {
  useCreateReviewMutation,
  useGetMyAssignmentsQuery,
} from '../../redux/api/reviewsApi';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';
import { tokenUtils } from '../../utils/token';
import type { Review } from '../../types/api.types';
import SubmissionInfoSection from '../../components/reviewer/SubmissionInfoSection';
import ReviewStatusBanner from '../../components/reviewer/ReviewStatusBanner';
import ScoreSelector from '../../components/reviewer/ScoreSelector';
import CommentSection from '../../components/reviewer/CommentSection';
import ReviewDetailsSection from '../../components/reviewer/ReviewDetailsSection';

interface ReviewFormProps {
  submissionId: string;
  assignmentId: number;
  onComplete: () => void;
  onBack: () => void;
}

const ReviewForm = ({
  submissionId,
  assignmentId,
  onComplete,
  onBack,
}: ReviewFormProps) => {
  const hasToken = tokenUtils.hasToken();
  const { data: submissionData } = useGetSubmissionByIdQuery(submissionId, {
    skip: !hasToken,
  });
  const { data: assignmentsData } = useGetMyAssignmentsQuery(undefined, {
    skip: !hasToken,
  });
  const [createReview, { isLoading }] = useCreateReviewMutation();

  const submission = submissionData?.data;
  const assignments = assignmentsData?.data || [];
  const currentAssignment = assignments.find((a) => a.id === assignmentId);
  const isCompleted = currentAssignment?.status === 'COMPLETED';
  // Get review from assignment (may need to cast type)
  const existingReview = (currentAssignment as any)?.review as
    | Review
    | undefined;

  // Check assignment dueDate to determine if can edit
  const dueDate = currentAssignment?.dueDate
    ? new Date(currentAssignment.dueDate)
    : null;
  const isDeadlinePassed = dueDate ? new Date() > dueDate : false;

  // Can edit if not completed, or completed but deadline not passed
  const canEdit = !isCompleted || (isCompleted && !isDeadlinePassed);

  // Backend uses 0-10 scale, so no normalization needed
  // Only normalize if score is > 10 (legacy 0-100 scale data)
  const normalizeExistingScore = (score?: number): number => {
    if (!score) return 5;
    // Only convert if score is clearly from 0-100 scale (> 10 to avoid converting valid 10)
    // If score is 10 or less, it's already on 0-10 scale
    return score > 10 ? Math.round(score / 10) : score;
  };

  const [score, setScore] = useState<number>(
    normalizeExistingScore(existingReview?.score),
  );
  const [comment, setComment] = useState(
    existingReview?.commentForAuthor || '',
  );
  const [showReview, setShowReview] = useState(false);

  // Update score and comment when existingReview is loaded
  useEffect(() => {
    if (existingReview) {
      const normalizedScore = normalizeExistingScore(existingReview.score);
      setScore(normalizedScore);
      setComment(existingReview.commentForAuthor || '');
    }
  }, [existingReview]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showToast.error('Vui lòng nhập nhận xét chi tiết');
      return;
    }

    try {
      await createReview({
        assignmentId,
        score,
        confidence: 'MEDIUM',
        commentForAuthor: comment,
        recommendation: 'ACCEPT', // Default recommendation, can be changed later by chair
      }).unwrap();
      showToast.success('Đánh giá bài viết thành công');
      onComplete();
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  // Move useMemo before early return to follow Rules of Hooks
  const statusBadge = useMemo(() => {
    if (isCompleted) {
      return (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
          Đã hoàn thành
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
        Đang đánh giá
      </span>
    );
  }, [isCompleted]);

  if (!submission) {
    return (
      <div className="flex justify-center items-center py-8">
        <CircularProgress disableShrink />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Article Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">{statusBadge}</div>
        <SubmissionInfoSection submission={submission} />
      </div>

      {/* Evaluation Section */}
      <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Đánh giá</h3>
        <ReviewStatusBanner
          isCompleted={isCompleted}
          canEdit={canEdit}
          isDeadlinePassed={isDeadlinePassed}
          dueDate={dueDate}
        />
        <ScoreSelector
          score={score}
          onScoreChange={setScore}
          disabled={isCompleted && !canEdit}
        />
      </div>

      {/* Comment Section */}
      <CommentSection
        comment={comment}
        onCommentChange={setComment}
        disabled={isCompleted && !canEdit}
      />

      {/* Review Details Section (when completed) */}
      {isCompleted && showReview && existingReview && (
        <ReviewDetailsSection
          review={existingReview}
          normalizeScore={normalizeExistingScore}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <div className="flex gap-2">
          {isCompleted && !canEdit && (
            <button
              onClick={() => setShowReview(!showReview)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showReview ? 'Ẩn đánh giá' : 'Xem đánh giá'}
            </button>
          )}
          {(canEdit || !isCompleted) && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <CircularProgress size={16} disableShrink />
                  Đang xử lý...
                </span>
              ) : canEdit ? (
                'Cập nhật đánh giá'
              ) : (
                'Nộp đánh giá'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
