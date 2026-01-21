import { memo } from 'react';
import type { Review } from '../../types/api.types';

interface ReviewDetailsSectionProps {
  review: Review;
  normalizeScore: (score?: number) => number;
}

const ReviewDetailsSection = memo(({ review, normalizeScore }: ReviewDetailsSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-2 border-green-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Đánh giá đã nộp</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Điểm số:</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-teal-600">
              {normalizeScore(review.score)}
            </span>
            <span className="text-sm text-gray-500">/ 10</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Nhận xét:</p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap">{review.commentForAuthor}</p>
          </div>
        </div>
        {review.recommendation && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Đề xuất:</p>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
              {review.recommendation === 'ACCEPT' && 'Chấp nhận'}
              {review.recommendation === 'WEAK_ACCEPT' && 'Chấp nhận yếu'}
              {review.recommendation === 'WEAK_REJECT' && 'Từ chối yếu'}
              {review.recommendation === 'REJECT' && 'Từ chối'}
            </span>
          </div>
        )}
        {review.createdAt && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Ngày nộp:</p>
            <p className="text-sm text-gray-600">
              {new Date(review.createdAt).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

ReviewDetailsSection.displayName = 'ReviewDetailsSection';

export default ReviewDetailsSection;


