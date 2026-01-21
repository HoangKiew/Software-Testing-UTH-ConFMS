import { memo } from 'react';
import type { TrackMember } from '../../types/api.types';

interface TrackHeaderProps {
  trackAssignment: TrackMember;
  isExpanded: boolean;
  onToggle: () => void;
}

const TrackHeader = memo(({ trackAssignment, isExpanded, onToggle }: TrackHeaderProps) => {
  const track = trackAssignment.track;

  if (!track) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">{track.name}</h3>
        {track.conference && (
          <p className="text-sm text-black mt-1">{track.conference.name}</p>
        )}
        <p className="text-xs text-black mt-1">
          Ngày chấp nhận: {new Date(trackAssignment.updatedAt).toLocaleString('vi-VN')}
        </p>
      </div>
      <button
        onClick={onToggle}
        className="px-4 py-2 ml-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
      >
        {isExpanded ? 'Ẩn bài nộp' : 'Xem các bài nộp'}
      </button>
    </div>
  );
});

TrackHeader.displayName = 'TrackHeader';

export default TrackHeader;


