import { useGetPublicTracksQuery } from '../../redux/api/conferencesApi';
import CircularProgress from '@mui/material/CircularProgress';
import type { Conference, Track } from '../../types/api.types';

interface ConferenceCardProps {
  conference: Conference;
  isExpanded: boolean;
  onToggle: () => void;
  onSubmit: (conferenceId: number, trackId?: number) => void;
}

// Check if conference is open for submission (not closed)
const isConferenceOpenForSubmission = (c: Conference): boolean => {
  const now = new Date();
  const submissionDeadline = c.cfpSetting?.submissionDeadline || c.submissionDeadline;
  const conferenceStartDate = new Date(c.startDate);

  // If no submission deadline, consider it closed
  if (!submissionDeadline) {
    return false;
  }

  const submissionDate = new Date(submissionDeadline);

  // Check if conference has started and submission deadline hasn't passed
  return now >= conferenceStartDate && now < submissionDate;
};

const ConferenceCard = ({
  conference,
  isExpanded,
  onToggle,
  onSubmit,
}: ConferenceCardProps) => {
  const { data: tracksData, isLoading: tracksLoading } = useGetPublicTracksQuery(
    conference.id,
    {
      skip: !isExpanded,
    },
  );
  const tracks: Track[] = tracksData?.data || [];
  const isOpen = isConferenceOpenForSubmission(conference);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <h2 className="font-semibold text-sm md:text-lg text-gray-800">{conference.name}</h2>
          {conference.submissionDeadline && (
            <p className="text-sm text-gray-500 mt-1">
              Hạn nộp:{' '}
              {new Date(conference.submissionDeadline).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            disabled={!isOpen}
            className={`px-4 py-2 ml-2 text-teal-600 border border-teal-600 rounded-lg transition-colors ${
              isOpen
                ? 'hover:bg-teal-50 cursor-pointer'
                : 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-500'
            }`}
            title={!isOpen ? 'Hội nghị đã đóng, không thể xem chủ đề' : ''}
          >
            {isExpanded ? 'Ẩn chủ đề' : 'Xem chủ đề'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {!isOpen ? (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 font-medium">
                Hội nghị đã đóng, không thể xem chủ đề và nộp bài.
              </p>
            </div>
          ) : tracksLoading ? (
            <div className="flex justify-center items-center py-2">
              <CircularProgress size={20} disableShrink />
            </div>
          ) : tracks.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có chủ đề nào</p>
          ) : (
            <div className="w-full">
              <p className="text-sm font-medium text-gray-700 mb-2">Các chủ đề:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 hover:border-teal-300 transition-colors"
                  >
                    <span className="text-sm max-w[120px] md:max-w-full text-gray-800">{track.name}</span>
                    <button
                      onClick={() => onSubmit(conference.id, track.id)}
                      disabled={!isOpen}
                      className={`py-2 px-3 md:p-3 m-2 text-xs rounded transition-colors ${
                        isOpen
                          ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                      }`}
                      title={!isOpen ? 'Hội nghị đã đóng, không thể nộp bài' : ''}
                    >
                      Nộp bài
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConferenceCard;


