import type { Conference } from '../../../types/api.types';

interface ConferenceListProps {
  conferences: Conference[];
  searchQuery: string;
  onViewDetail: (conferenceId: number) => void;
  onDelete: (conferenceId: number) => void;
}

const ConferenceList = ({
  conferences,
  searchQuery,
  onViewDetail,
  onDelete,
}: ConferenceListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (conferences.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          {searchQuery ? 'Không tìm thấy hội nghị nào' : 'Chưa có hội nghị nào'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conferences.map((conference: Conference) => (
        <div
          key={conference.id}
          className="bg-surface rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-text-main mb-2">
                {conference.name}
              </h2>
              {conference.description && (
                <p className="text-text-sub mb-4 line-clamp-2">
                  {conference.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-text-sub">
                <div>
                  <span className="font-medium">Ngày bắt đầu:</span>{' '}
                  {formatDate(conference.startDate)}
                </div>
                <div>
                  <span className="font-medium">Ngày kết thúc:</span>{' '}
                  {formatDate(conference.endDate)}
                </div>
                {conference.submissionDeadline && (
                  <div>
                    <span className="font-medium">Hạn nộp bài:</span>{' '}
                    {formatDate(conference.submissionDeadline)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={() => onViewDetail(conference.id)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Chi tiết
              </button>
              <button
                onClick={() => onDelete(conference.id)}
                className="w-10 h-10 bg-danger rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                title="Xóa hội nghị"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConferenceList;
