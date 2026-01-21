import type { Conference } from '../../../types/api.types';

interface ConferenceListForTracksProps {
  conferences: Conference[];
  searchQuery: string;
  onViewDetail: (conferenceId: number) => void;
}

const ConferenceListForTracks = ({
  conferences,
  searchQuery,
  onViewDetail,
}: ConferenceListForTracksProps) => {
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
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {conference.name}
              </h2>
              {conference.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {conference.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConferenceListForTracks;













