import { memo, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetSubmissionByIdQuery,
  useUpdateSubmissionStatusMutation,
} from '../../redux/api/submissionsApi';
import { useGetReviewsForSubmissionQuery } from '../../redux/api/reviewsApi';
import { useGetUsersQuery } from '../../redux/api/usersApi';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';
import { useIsInLayoutApp } from '../../utils/layout-helpers';
import type { Review } from '../../types/api.types';

interface SubmissionDetailSectionProps {
  submissionId: string;
}

const SubmissionDetailSection = memo(
  ({ submissionId }: SubmissionDetailSectionProps) => {
    const { data: submissionData, isLoading: submissionLoading } =
      useGetSubmissionByIdQuery(submissionId);
    const { data: reviewsData, isLoading: reviewsLoading } =
      useGetReviewsForSubmissionQuery(submissionId);
    const [updateStatus, { isLoading: isUpdating }] =
      useUpdateSubmissionStatusMutation();
    const { user } = useAuth();
    const isInLayoutApp = useIsInLayoutApp();
    
    // Fetch users to enrich reviewer names if in LayoutApp
    const { data: usersData } = useGetUsersQuery(undefined, {
      skip: !isInLayoutApp,
    });

    const submission = submissionData?.data;
    const rawReviews: Review[] = reviewsData?.data || [];

    // Enrich reviews with reviewer names from users API if in LayoutApp
    const reviews = useMemo(() => {
      if (!isInLayoutApp || !usersData?.data) {
        return rawReviews;
      }

      const userMap = new Map(
        usersData.data.map((u) => [u.id, u])
      );

      return rawReviews.map((review) => {
        // If reviewerName already exists and is not a fallback "Reviewer #ID", use it
        if (review.reviewerName && !review.reviewerName.startsWith('Reviewer #')) {
          return review;
        }

        // Try to get reviewer name from users list
        const reviewer = review.reviewerId ? userMap.get(review.reviewerId) : null;
        if (reviewer) {
          return {
            ...review,
            reviewerName: reviewer.fullName || reviewer.email || `Reviewer #${review.reviewerId}`,
          };
        }

        return review;
      });
    }, [rawReviews, usersData, isInLayoutApp]);

    const isLoading = submissionLoading || reviewsLoading;

    // Check if user is Chair or Admin
    const isChairOrAdmin =
      user?.roles?.includes('CHAIR') || user?.roles?.includes('ADMIN');

    // Calculate statistics
    const averageScore =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
          ).toFixed(1)
        : '0.0';

    // Handle accept/reject
    const handleAccept = async () => {
      if (!submission) return;

      if (!window.confirm('Bạn có chắc chắn muốn chấp nhận bài nộp này?')) {
        return;
      }

      try {
        await updateStatus({
          id: submissionId,
          data: { status: 'ACCEPTED' },
        }).unwrap();
        showToast.success('Đã chấp nhận bài nộp thành công');
      } catch (error) {
        showToast.error(formatApiError(error));
      }
    };

    const handleReject = async () => {
      if (!submission) return;

      if (!window.confirm('Bạn có chắc chắn muốn từ chối bài nộp này?')) {
        return;
      }

      try {
        await updateStatus({
          id: submissionId,
          data: { status: 'REJECTED' },
        }).unwrap();
        showToast.success('Đã từ chối bài nộp thành công');
      } catch (error) {
        showToast.error(formatApiError(error));
      }
    };

    // Check if can accept/reject
    // Show buttons if:
    // 1. User is Chair/Admin
    // 2. Submission has reviews (reviews.length > 0)
    // 3. Status is REVIEWING (can make decision) or SUBMITTED with reviews (can make decision after review)
    const hasReviews = reviews.length > 0;
    const canMakeDecision =
      isChairOrAdmin &&
      hasReviews &&
      (submission?.status === 'REVIEWING' ||
        (submission?.status === 'SUBMITTED' && hasReviews));

    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      );
    }

    if (!submission) {
      return (
        <div className="p-4 text-center text-red-600">
          Không tìm thấy bài nộp
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Submission Info */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-2 py-1 text-xs rounded ${
                submission.status === 'REVIEWING'
                  ? 'bg-blue-100 text-blue-800'
                  : submission.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : submission.status === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {submission.status === 'REVIEWING'
                ? 'Đang phản biện'
                : submission.status === 'ACCEPTED'
                  ? 'Đã chấp nhận'
                  : submission.status === 'REJECTED'
                    ? 'Đã từ chối'
                    : submission.status}
            </span>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {submission.title}
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Tác giả:</p>
              <p className="text-gray-600">
                {submission.authorName || `ID: ${submission.authorId}`}
              </p>
              {submission.authorAffiliation && (
                <p className="text-sm text-gray-500 mt-1">
                  {submission.authorAffiliation}
                </p>
              )}
            </div>

            {submission.coAuthors && submission.coAuthors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Đồng tác giả:
                </p>
                <div className="space-y-1">
                  {submission.coAuthors.map((coAuthor, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      <span className="font-medium">{coAuthor.name}</span>
                      {coAuthor.email && (
                        <span className="text-gray-500">
                          {' '}
                          ({coAuthor.email})
                        </span>
                      )}
                      {coAuthor.affiliation && (
                        <span className="text-gray-500">
                          {' '}
                          - {coAuthor.affiliation}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submission.abstract && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Tóm tắt:
                </p>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {submission.abstract}
                </p>
              </div>
            )}

            {submission.keywords && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Từ khóa:
                </p>
                <div className="flex flex-wrap gap-2">
                  {submission.keywords.split(',').map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Show camera-ready file if status is CAMERA_READY, otherwise show original file */}
            {submission.status === 'CAMERA_READY' &&
            submission.cameraReadyFileUrl ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  File bản hoàn thiện:
                </p>
                <button
                  onClick={() =>
                    window.open(submission.cameraReadyFileUrl, '_blank')
                  }
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Tải xuống file bản hoàn thiện
                </button>
              </div>
            ) : (
              submission.fileUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    File bài nộp:
                  </p>
                  <button
                    onClick={() => window.open(submission.fileUrl, '_blank')}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Tải xuống file PDF
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Phản biện</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                <span className="font-medium">Số phản biện:</span>{' '}
                {reviews.length}
              </span>
              {reviews.length > 0 && (
                <span>
                  <span className="font-medium">Điểm trung bình:</span>{' '}
                  {averageScore}/10
                </span>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              Chưa có phản biện nào
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                // Show reviewer name if in LayoutApp (admin pages), otherwise show anonymous
                // Reviewer name is enriched from users API in useMemo above
                let reviewerName: string;
                if (isInLayoutApp) {
                  // In admin pages (LayoutApp), use enriched reviewerName
                  if (review.reviewerName && !review.reviewerName.startsWith('Reviewer #')) {
                    reviewerName = review.reviewerName;
                  } else if (review.reviewerId) {
                    reviewerName = `Reviewer #${review.reviewerId}`;
                  } else {
                    reviewerName = 'Reviewer';
                  }
                } else {
                  // In other pages (student/reviewer), always show anonymous
                  reviewerName = review.reviewerId ? `Reviewer #${review.reviewerId}` : 'Reviewer';
                }

                return (
                  <div
                    key={review.id}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          {reviewerName}
                        </h4>
                      </div>
                      <div className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm font-semibold">
                        {review.score.toFixed(1)}/10
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {review.commentForAuthor}
                      </p>
                    </div>

                    {review.commentForPC && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Nhận xét cho Ban Chương trình:
                        </p>
                        <p className="text-blue-700 whitespace-pre-wrap text-sm">
                          {review.commentForPC}
                        </p>
                      </div>
                    )}

                    {review.createdAt && (
                      <p className="text-xs text-gray-500 mt-4">
                        Ngày đánh giá:{' '}
                        {new Date(review.createdAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Decision Buttons (Only show if status is REVIEWING and user is Chair/Admin) - After reviews */}
        {canMakeDecision && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quyết định
            </h3>
            <div className="flex justify-between">
              <button
                onClick={handleAccept}
                disabled={isUpdating}
                className="px-6 py-2 border border-primary text-text-main font-medium rounded-lg hover:bg-green-700 hover:text-white hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Chấp nhận
              </button>
              <button
                onClick={handleReject}
                disabled={isUpdating}
                className="px-6 py-2 border border-danger text-text-main rounded-lg hover:bg-red-700 hover:text-white hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Từ chối
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

SubmissionDetailSection.displayName = 'SubmissionDetailSection';

export default SubmissionDetailSection;
