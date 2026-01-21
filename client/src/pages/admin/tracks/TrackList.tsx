import type { Track } from '../../../types/api.types';

interface TrackListProps {
  tracks: Track[];
  onEdit: (track: Track) => void;
  onDelete: (trackId: number) => void;
}

const TrackList = ({ tracks, onEdit, onDelete }: TrackListProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Chưa có dữ liệu';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Chưa có chủ đề nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tracks.map((track: Track) => (
        <div
          key={track.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {track.name}
              </h2>
              {track.description && (
                <p className="text-gray-600 mb-4">{track.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Ngày tạo:</span>{' '}
                  {formatDate(track.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={() => onEdit(track)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Sửa
              </button>
              <button
                onClick={() => onDelete(track.id)}
                className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                title="Xóa chủ đề"
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

export default TrackList;


