import { useState } from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetSubmissionByIdQuery } from '../../redux/api/submissionsApi';
import { useGetConferenceByIdQuery, useGetTracksQuery } from '../../redux/api/conferencesApi';
import { useGetAnonymizedReviewsForSubmissionQuery } from '../../redux/api/reviewsApi';
import ReviewsTable from '../../components/student/ReviewsTable';
// Removed import - using local functions instead
import type { SubmissionStatus } from '../../types/api.types';

const StudentSubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [showReviews, setShowReviews] = useState(false);

  const { data: submissionData, isLoading: submissionLoading, error: submissionError } =
    useGetSubmissionByIdQuery(id!);

  const submission = submissionData?.data;

  // Fetch conference and track info
  const { data: conferenceData } = useGetConferenceByIdQuery(submission?.conferenceId || 0, {
    skip: !submission?.conferenceId,
  });
  const { data: tracksData } = useGetTracksQuery(submission?.conferenceId || 0, {
    skip: !submission?.conferenceId,
  });

  // Fetch reviews if needed - show button for submissions in review states
  const shouldShowReviewsButton =
    submission &&
    (submission.status !== 'DRAFT' &&
      (submission.status === 'REVIEWING' ||
        submission.status === 'ACCEPTED' ||
        submission.status === 'REJECTED' ||
        submission.status === 'CAMERA_READY' ||
        submission.status === 'SUBMITTED'));

  const { data: reviewsData, isLoading: isLoadingReviews } =
    useGetAnonymizedReviewsForSubmissionQuery(submission?.id || '', {
      skip: !shouldShowReviewsButton || !submission || !showReviews,
    });

  const hasReviews = (reviewsData?.data?.length || 0) > 0;

  const conference = conferenceData?.data;
  const tracks = tracksData?.data || [];
  const track = tracks.find((t) => t.id === submission?.trackId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'border-3 border-gray-400';
      case 'SUBMITTED':
        return 'border-3 border-blue-400';
      case 'REVIEWING':
        return 'border-3 border-yellow-400';
      case 'ACCEPTED':
        return 'border-3 border-green-500';
      case 'REJECTED':
        return 'border-3 border-red-500';
      case 'CAMERA_READY':
        return 'border-3 border-green-400';
      case 'WITHDRAWN':
        return 'border-3 border-gray-500';
      default:
        return 'border-3 border-gray-400';
    }
  };

  const getStatusBadgeLabel = (status: SubmissionStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'Bản nháp';
      case 'SUBMITTED':
        return 'Đã nộp';
      case 'REVIEWING':
        return 'Đang phản biện';
      case 'ACCEPTED':
        return 'Đã chấp nhận';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'CAMERA_READY':
        return 'Đã nộp bản cuối';
      case 'WITHDRAWN':
        return 'Đã rút';
      default:
        return status;
    }
  };

  if (submissionLoading) {
    return (
      <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center py-16">
            <CircularProgress disableShrink />
          </div>
        </div>
      </div>
    );
  }

  if (submissionError || !submission) {
    return (
      <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-red-600 text-center">
              Không tìm thấy bài nộp hoặc đã xảy ra lỗi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusBadgeColor(submission.status);
  const statusLabel = getStatusBadgeLabel(submission.status);

  return (
    <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-6">Bài đã nộp</h1>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
          {/* Header with title and status */}
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold text-gray-800 flex-1 pr-4">
              {submission.title}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} text-black whitespace-nowrap`}
            >
              {statusLabel}
            </span>
          </div>

          {/* Submission Details */}
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Hội nghị:</span>{' '}
              <span className="text-gray-600">
                {conference?.name || `Hội nghị #${submission.conferenceId}`}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Chủ đề:</span>{' '}
              <span className="text-gray-600">
                {track?.name || `Chủ đề #${submission.trackId}`}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tóm tắt:</span>{' '}
              <span className="text-gray-600">{submission.abstract}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Ngày nộp:</span>{' '}
              <span className="text-gray-600">
                {formatDate(submission.submittedAt || submission.createdAt)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {/* Show camera ready file if available, otherwise show original file */}
            {(submission.cameraReadyFileUrl || submission.fileUrl) && (
              <button
                onClick={() =>
                  window.open(submission.cameraReadyFileUrl || submission.fileUrl, '_blank')
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Xem file
              </button>
            )}
            {shouldShowReviewsButton && (
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="px-4 py-2 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
              >
                {showReviews ? 'Ẩn phản biện' : 'Xem phản biện'}
              </button>
            )}
          </div>

          {/* Reviews Section - Expandable */}
          {showReviews && shouldShowReviewsButton && (
            <div className="pt-4 border-t border-gray-200">
              {isLoadingReviews ? (
                <div className="flex justify-center items-center py-8">
                  <CircularProgress disableShrink />
                </div>
              ) : hasReviews ? (
                <ReviewsTable submissionId={submission.id} isLoading={false} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có phản biện nào cho bài nộp này.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSubmissionDetail;
