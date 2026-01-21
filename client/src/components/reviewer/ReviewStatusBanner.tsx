import { memo } from 'react';

interface ReviewStatusBannerProps {
  isCompleted: boolean;
  canEdit: boolean;
  isDeadlinePassed: boolean;
  dueDate: Date | null;
}

const ReviewStatusBanner = memo(({ 
  isCompleted, 
  canEdit, 
  isDeadlinePassed, 
  dueDate 
}: ReviewStatusBannerProps) => {
  if (!isCompleted) return null;

  return (
    <div className={`mb-4 p-3 rounded-lg ${
      canEdit 
        ? 'bg-yellow-50 border border-yellow-200' 
        : 'bg-green-50 border border-green-200'
    }`}>
      <p className={`text-sm ${
        canEdit ? 'text-yellow-700' : 'text-green-700'
      }`}>
        {canEdit 
          ? '✓ Bạn đã nộp đánh giá. Bạn có thể chỉnh sửa trước khi hết hạn phản biện.'
          : isDeadlinePassed
          ? '✓ Bạn đã nộp đánh giá. Đã hết hạn phản biện, không thể chỉnh sửa.'
          : '✓ Bạn đã nộp đánh giá cho bài viết này.'
        }
      </p>
      {dueDate && (
        <p className={`text-xs mt-1 ${
          canEdit ? 'text-yellow-600' : 'text-green-600'
        }`}>
          Hạn nộp: {dueDate.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
});

ReviewStatusBanner.displayName = 'ReviewStatusBanner';

export default ReviewStatusBanner;


