import { memo } from 'react';

interface RebuttalHeaderProps {
  totalReviews: number;
  averageScore: string;
  submissionDeadline?: string;
  daysLeft: number;
}

const RebuttalHeader = memo(
  ({
    totalReviews,
    averageScore,
    submissionDeadline,
    daysLeft,
  }: RebuttalHeaderProps) => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-2">Cửa Sổ Phúc Đáp</h1>
        <div className="flex justify-between items-center">
          <div className='text-center'>
            <p className="text-sm text-gray-600">Số phản biện</p>
            <p className="text-2xl font-bold text-gray-800">{totalReviews}</p>
          </div>
          <div className='text-center'>
            <p className="text-sm text-gray-600">Điểm trung bình</p>
            <p className="text-2xl font-bold text-gray-800">
              {averageScore}/10
            </p>
          </div>
          {submissionDeadline && (
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Hạn chót đánh giá</div>
              <div className="text-lg font-semibold text-gray-800">
                {new Date(submissionDeadline).toLocaleDateString('vi-VN')}
              </div>
              <div className="text-sm text-teal-600 font-medium">
                Còn {daysLeft} ngày
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

RebuttalHeader.displayName = 'RebuttalHeader';

export default RebuttalHeader;
