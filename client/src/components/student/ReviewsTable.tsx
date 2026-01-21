import CircularProgress from '@mui/material/CircularProgress';
import { useGetAnonymizedReviewsForSubmissionQuery } from '../../redux/api/reviewsApi';

interface ReviewsTableProps {
  submissionId: string;
  isLoading: boolean;
}

const ReviewsTable = ({ submissionId, isLoading }: ReviewsTableProps) => {
  const { data: reviewsData, error } = useGetAnonymizedReviewsForSubmissionQuery(submissionId);
  const reviews = reviewsData?.data || [];

  const getRecommendationLabel = (recommendation: string): string => {
    const map: Record<string, string> = {
      ACCEPT: 'Chấp nhận',
      WEAK_ACCEPT: 'Chấp nhận với sửa nhỏ',
      WEAK_REJECT: 'Từ chối yếu',
      REJECT: 'Từ chối',
    };
    return map[recommendation] || recommendation;
  };

  const getRecommendationColor = (recommendation: string): string => {
    const map: Record<string, string> = {
      ACCEPT: 'bg-green-100 text-green-700',
      WEAK_ACCEPT: 'bg-teal-100 text-teal-700',
      WEAK_REJECT: 'bg-yellow-100 text-yellow-700',
      REJECT: 'bg-red-100 text-red-700',
    };
    return map[recommendation] || 'bg-gray-100 text-gray-700';
  };

  const averageScore =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1)
      : '0.0';

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          Không thể tải phản biện. Vui lòng thử lại sau.
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có phản biện nào cho bài nộp này.
        </div>
      ) : (
        <>
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-black">Số phản biện</p>
                <p className="text-2xl text-center font-bold text-gray-800">{reviews.length}</p>
              </div>
              <div>
                <p className="text-sm text-black">Điểm trung bình</p>
                <p className="text-2xl text-center font-bold text-teal-600">{averageScore}/10</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Giảng viên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Điểm số
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Đề xuất
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Nhận xét
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        Giảng viên {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-teal-600">
                        {review.score.toFixed(1)}/10
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${getRecommendationColor(
                          review.recommendation,
                        )}`}
                      >
                        {getRecommendationLabel(review.recommendation)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-black whitespace-pre-wrap">
                        {review.commentForAuthor || '-'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewsTable;


