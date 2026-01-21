import type { Conference } from '../../types/api.types';

interface SubmissionFormHeaderProps {
  isEditMode: boolean;
  conference: Conference;
  calculateDaysLeft: (deadline: string) => number;
}

const SubmissionFormHeader = ({
  isEditMode,
  conference,
  calculateDaysLeft,
}: SubmissionFormHeaderProps) => {
  const submissionDeadline =
    conference.cfpSetting?.submissionDeadline || conference.submissionDeadline;
  const daysLeft = submissionDeadline ? calculateDaysLeft(submissionDeadline) : 0;
  const isDeadlinePassed = submissionDeadline
    ? new Date() > new Date(submissionDeadline)
    : false;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditMode ? 'Chỉnh sửa bài nộp' : 'Nộp Bài'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? 'Chỉnh sửa thông tin bài nghiên cứu của bạn'
              : 'Vui lòng điền đầy đủ thông tin bên dưới để nộp bài nghiên cứu của bạn'}
          </p>
        </div>
        {submissionDeadline && (
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Hạn chót nộp bài</div>
            <div className="text-lg font-semibold text-gray-800">
              {new Date(submissionDeadline).toLocaleDateString('vi-VN')}
            </div>
            {isDeadlinePassed ? (
              <div className="text-sm text-red-600 font-medium">Đã hết hạn</div>
            ) : (
              <div className="text-sm text-teal-600 font-medium">
                Còn {daysLeft} ngày
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deadline Warning */}
      {isDeadlinePassed && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold mb-1">Hạn nộp bài đã qua</h3>
              <p className="text-red-700 text-sm">
                Hạn nộp bài là{' '}
                {new Date(submissionDeadline!).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                . Bạn không thể nộp bài mới nữa. Vui lòng liên hệ ban tổ chức nếu cần
                hỗ trợ.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionFormHeader;


