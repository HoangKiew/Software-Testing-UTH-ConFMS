import { memo } from 'react';
import type { SubmissionStatus } from '../../../types/api.types';
import type { Conference, Track } from '../../../types/api.types';

interface SubmissionsFiltersProps {
  conferences: Conference[];
  tracks: Track[];
  selectedConferenceId: number | null;
  selectedTrackId: number | null;
  selectedStatus: SubmissionStatus | '';
  searchQuery: string;
  onConferenceChange: (conferenceId: number | null) => void;
  onTrackChange: (trackId: number | null) => void;
  onStatusChange: (status: SubmissionStatus | '') => void;
  onSearchChange: (query: string) => void;
}

const SubmissionsFilters = memo(({
  conferences,
  tracks,
  selectedConferenceId,
  selectedTrackId,
  selectedStatus,
  searchQuery,
  onConferenceChange,
  onTrackChange,
  onStatusChange,
  onSearchChange,
}: SubmissionsFiltersProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Bộ lọc</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Conference Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hội nghị
          </label>
          <select
            value={selectedConferenceId || ''}
            onChange={(e) => {
              onConferenceChange(e.target.value ? Number(e.target.value) : null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Tất cả hội nghị</option>
            {conferences.map((conference) => (
              <option key={conference.id} value={conference.id}>
                {conference.name}
              </option>
            ))}
          </select>
        </div>

        {/* Track Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chủ đề
          </label>
          <select
            value={selectedTrackId || ''}
            onChange={(e) => {
              onTrackChange(e.target.value ? Number(e.target.value) : null);
            }}
            disabled={!selectedConferenceId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Tất cả chủ đề</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              onStatusChange(e.target.value as SubmissionStatus | '');
            }}
            disabled={selectedStatus === 'REJECTED'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="SUBMITTED">Đã nộp</option>
            <option value="WITHDRAWN">Đã rút</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tìm kiếm
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tiêu đề, tác giả..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
});

SubmissionsFilters.displayName = 'SubmissionsFilters';

export default SubmissionsFilters;
