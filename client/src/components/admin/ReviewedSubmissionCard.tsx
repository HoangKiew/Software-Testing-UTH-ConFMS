import { memo, useState } from 'react';
import type { Submission } from '../../types/api.types';
import SubmissionDetailSection from './SubmissionDetailSection';

interface ReviewedSubmissionCardProps {
  submission: Submission;
  reviewCount: number;
  averageScore?: number;
  onViewDetails?: (submissionId: string) => void; // Made optional since we're using expandable
}

const ReviewedSubmissionCard = memo(
  ({
    submission,
    reviewCount,
    averageScore,
    onViewDetails,
  }: ReviewedSubmissionCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'REVIEWING':
          return 'bg-blue-100 text-blue-800';
        case 'ACCEPTED':
          return 'bg-green-100 text-green-800';
        case 'REJECTED':
          return 'bg-red-100 text-red-800';
        case 'CAMERA_READY':
          return 'bg-purple-100 text-purple-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'REVIEWING':
          return 'Đang phản biện';
        case 'ACCEPTED':
          return 'Đã chấp nhận';
        case 'REJECTED':
          return 'Đã từ chối';
        case 'CAMERA_READY':
          return 'Bản hoàn thiện';
        default:
          return status;
      }
    };

    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-1 font-medium text-ms rounded ${getStatusColor(submission.status)}`}
              >
                {getStatusLabel(submission.status)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {submission.title}
            </h3>
            <p className="text-ms text-text-main mb-1">
              <span className="font-medium text-text-main">Tác giả:</span>{' '}
              {submission.authorName || `ID: ${submission.authorId}`}
            </p>
            {submission.authorAffiliation && (
              <p className="text-ms text-text-sub mb-2">
                {submission.authorAffiliation}
              </p>
            )}
            {submission.keywords && (
              <div className="flex flex-wrap gap-2 mt-2">
                {submission.keywords
                  .split(',')
                  .slice(0, 3)
                  .map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-ms bg-teal-100 text-teal-700 rounded"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-lg  text-text-main">
            <span>
              <span className="font-medium">Số phản biện:</span> {reviewCount}
            </span>
            {averageScore !== undefined && (
              <span>
                <span className="font-medium">Điểm TB:</span>{' '}
                {averageScore.toFixed(1)}/10
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (onViewDetails && !isExpanded) {
                onViewDetails(submission.id);
              }
            }}
            className="p-3 border border-primary text-text-main rounded-lg hover:bg-teal-700 hover:text-white hover:cursor-pointer transition-colors"
          >
            {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>
        </div>

        {/* Expandable Detail Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <SubmissionDetailSection submissionId={submission.id} />
          </div>
        )}
      </div>
    );
  },
);

ReviewedSubmissionCard.displayName = 'ReviewedSubmissionCard';

export default ReviewedSubmissionCard;
