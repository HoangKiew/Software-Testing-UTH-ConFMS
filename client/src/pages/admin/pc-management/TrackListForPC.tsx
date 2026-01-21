import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetTracksQuery } from '../../../redux/api/conferencesApi';
import type { Conference, Track } from '../../../types/api.types';

interface TrackListForPCProps {
  conferences: Conference[];
  searchQuery: string;
  onViewTrackDetail: (conferenceId: number, trackId: number) => void;
}

const TrackListForPC = ({
  conferences,
  searchQuery,
  onViewTrackDetail,
}: TrackListForPCProps) => {
  const [expandedConferenceId, setExpandedConferenceId] = useState<number | null>(null);

  const toggleConference = (conferenceId: number) => {
    setExpandedConferenceId(
      expandedConferenceId === conferenceId ? null : conferenceId
    );
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
        <ConferenceTracks
          key={conference.id}
          conference={conference}
          isExpanded={expandedConferenceId === conference.id}
          onToggle={() => toggleConference(conference.id)}
          onViewTrackDetail={onViewTrackDetail}
        />
      ))}
    </div>
  );
};

interface ConferenceTracksProps {
  conference: Conference;
  isExpanded: boolean;
  onToggle: () => void;
  onViewTrackDetail: (conferenceId: number, trackId: number) => void;
}

const ConferenceTracks = ({
  conference,
  isExpanded,
  onToggle,
  onViewTrackDetail,
}: ConferenceTracksProps) => {
  const { data: tracksData, isLoading } = useGetTracksQuery(conference.id);
  const tracks = tracksData?.data && Array.isArray(tracksData.data) ? tracksData.data : [];

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {conference.name}
          </h2>
          {conference.description && (
            <p className="text-gray-600 mb-4 line-clamp-2">
              {conference.description}
            </p>
          )}
        </div>
        <button
          onClick={onToggle}
          className="ml-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          {isExpanded ? 'Thu gọn' : 'Xem chủ đề'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-solid border-t-border pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <CircularProgress size={20} disableShrink />
            </div>
          ) : tracks.length === 0 ? (
            <p className="text-gray-600">Chưa có chủ đề nào</p>
          ) : (
            <div className="space-y-3">
              {tracks.map((track: Track) => (
                <div
                  key={track.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-800">
                        {track.name}
                      </h3>
                      {track.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {track.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onViewTrackDetail(conference.id, track.id)}
                      className="ml-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Quản lý PC
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackListForPC;







