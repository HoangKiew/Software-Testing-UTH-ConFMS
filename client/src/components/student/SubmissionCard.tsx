import { useState, useRef } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetAnonymizedReviewsForSubmissionQuery } from '../../redux/api/reviewsApi';
import { useUploadCameraReadyMutation } from '../../redux/api/submissionsApi';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';
import type { Submission} from '../../types/api.types';
import ReviewsTable from './ReviewsTable';

interface SubmissionCardProps {
  submission: Submission;
  conferenceName: string;
  trackName: string;
  statusLabel: string;
  statusColor: string;
  onEdit: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  isWithdrawing: boolean;
}

const SubmissionCard = ({
  submission,
  conferenceName,
  trackName,
  statusLabel,
  statusColor,
  onEdit,
  onDelete,
  isWithdrawing,
}: SubmissionCardProps) => {
  const [showReviews, setShowReviews] = useState(false);
  const [uploadCameraReady, { isLoading: isUploading }] = useUploadCameraReadyMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if submission has reviews (only query for non-draft submissions)
  // Prefetch reviews to check if they exist (for disabling edit/delete)
  const shouldCheckReviews =
    submission.status !== 'DRAFT' &&
    (submission.status === 'SUBMITTED' ||
      submission.status === 'REVIEWING' ||
      submission.status === 'ACCEPTED' ||
      submission.status === 'REJECTED' ||
      submission.status === 'CAMERA_READY');

  // Prefetch reviews to check if they exist (always fetch if shouldCheckReviews, not just when expanded)
  const { data: reviewsData, isLoading: isLoadingReviews } =
    useGetAnonymizedReviewsForSubmissionQuery(submission.id, {
      skip: !shouldCheckReviews,
    });
  const hasReviews = (reviewsData?.data?.length || 0) > 0;

  // Cannot edit/delete if submission has reviews
  // Also cannot edit/delete if status is ACCEPTED, REJECTED, or CAMERA_READY (final states)
  const canEdit =
    !hasReviews &&
    submission.status !== 'ACCEPTED' &&
    submission.status !== 'REJECTED' &&
    submission.status !== 'CAMERA_READY' &&
    (submission.status === 'DRAFT' || submission.status === 'SUBMITTED');

  const canDelete =
    !hasReviews &&
    submission.status !== 'ACCEPTED' &&
    submission.status !== 'REJECTED' &&
    submission.status !== 'CAMERA_READY' &&
    (submission.status === 'DRAFT' ||
      submission.status === 'SUBMITTED' ||
      submission.status === 'REVIEWING');

  // Show reviews button if submission has reviews or is in review states
  const canViewReviews =
    hasReviews ||
    submission.status === 'REVIEWING' ||
    submission.status === 'ACCEPTED' ||
    submission.status === 'REJECTED' ||
    submission.status === 'CAMERA_READY';

  // Show camera-ready upload button only if status is ACCEPTED
  const canUploadCameraReady = submission.status === 'ACCEPTED';

  const handleCameraReadyClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      showToast.error('Chỉ chấp nhận file PDF');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast.error('File không được vượt quá 20MB');
      return;
    }

    try {
      await uploadCameraReady({ id: submission.id, file }).unwrap();
      showToast.success('Nộp bản cuối cùng thành công');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className=" text-ms md:text-lg font-semibold text-gray-800 mb-2">{submission.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">Hội nghị:</span> {conferenceName}
            </div>
            <div>
              <span className="font-medium">Chủ đề:</span> {trackName}
            </div>
            <div>
              <span className="font-medium">Tóm tắt:</span>{' '}
              {submission.abstract.length > 100
                ? `${submission.abstract.substring(0, 100)}...`
                : submission.abstract}
            </div>
            <div>
              <span className="font-medium">Ngày nộp:</span>{' '}
              {new Date(submission.submittedAt || submission.createdAt).toLocaleDateString(
                'vi-VN',
                {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}
            </div>
          </div>
        </div>
        <div className="ml-4 flex flex-col items-end gap-4">
          <span className={`p-3 rounded-full text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          {submission.fileUrl && (
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-primary text-text-main rounded-3xl hover:bg-primary hover:cursor-pointer hover:text-white font-medium transition-colors"
            >
              Xem file
            </a>
          )}
          
        </div>
      </div>
      {(canEdit || canDelete || canViewReviews) && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          {canViewReviews && (
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="px-4 py-2 text-sm text-teal-600 border border-teal-300 rounded-lg hover:bg-teal-50 hover:cursor-pointer transition-colors"
            >
              {showReviews ? 'Ẩn phản biện' : 'Xem phản biện'}
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onEdit(submission)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sửa
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(submission)}
              disabled={isWithdrawing}
              className="md:px-4 md:py-2 p-1 text-sm  text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {submission.status === 'DRAFT' ? 'Xóa' : 'Rút bài'}
            </button>
          )}
          {canUploadCameraReady && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleCameraReadyClick}
                disabled={isUploading}
                className="md:px-4 md:py-2 p-1 text-sm  text-teal-600 border border-teal-300 rounded-lg hover:bg-green-300 hover:text-white hover:font-medium hover:cursor-pointer transition-colors"
              >
                {isUploading ? (
                  <>
                    <CircularProgress size={16} disableShrink className="text-white" />
                    Đang tải...
                  </>
                ) : (
                  'Nộp bản cuối cùng'
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Reviews Table - Expandable */}
      {showReviews && canViewReviews && (
        <ReviewsTable submissionId={submission.id} isLoading={isLoadingReviews} />
      )}
    </div>
  );
};

export default SubmissionCard;

