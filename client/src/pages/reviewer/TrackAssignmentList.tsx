import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetMyTrackAssignmentsQuery,
  useAcceptTrackAssignmentMutation,
  useRejectTrackAssignmentMutation,
} from '../../redux/api/conferencesApi';
import { showToast } from '../../utils/toast';
import { formatApiError } from '../../utils/api-helpers';
import { tokenUtils } from '../../utils/token';
import type { TrackMember } from '../../types/api.types';

interface TrackAssignmentListProps {
  onAcceptTrack?: (trackId: number, conferenceId: number) => void;
}

const TrackAssignmentList = ({ onAcceptTrack }: TrackAssignmentListProps) => {
  const hasToken = tokenUtils.hasToken();
  const { data: assignmentsData, isLoading, refetch } = useGetMyTrackAssignmentsQuery(undefined, {
    skip: !hasToken,
  });
  const [acceptTrackAssignment] = useAcceptTrackAssignmentMutation();
  const [rejectTrackAssignment] = useRejectTrackAssignmentMutation();

  const assignments: TrackMember[] = assignmentsData?.data || [];
  
  const pendingAssignments = assignments.filter((a) => {
    const status = a.status || 'PENDING';
    return status === 'PENDING';
  });
  
  const handleAccept = async (trackId: number, conferenceId: number) => {
    try {
      await acceptTrackAssignment(trackId).unwrap();
      showToast.success('Đã chấp nhận phân công chủ đề thành công');
      refetch();
      if (onAcceptTrack) {
        onAcceptTrack(trackId, conferenceId);
      }
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  const handleReject = async (trackId: number) => {
    try {
      await rejectTrackAssignment(trackId).unwrap();
      showToast.success('Đã từ chối phân công chủ đề');
      refetch();
    } catch (error) {
      showToast.error(formatApiError(error));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="flex justify-center items-center py-4">
          <CircularProgress size={24} disableShrink />
        </div>
      </div>
    );
  }

  if (pendingAssignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Chưa có phân công nào
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingAssignments.map((assignment) => {
        const track = assignment.track;
        const conference = track?.conference;

        if (!track) {
          return null;
        }

        return (
          <div key={assignment.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{track.name}</h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                    Chờ xác nhận
                  </span>
                </div>
                {conference && (
                  <p className="text-sm text-gray-500">{conference.name}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Ngày thêm: {new Date(assignment.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(track.id, track.conferenceId)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Chấp nhận
                </button>
                <button
                  onClick={() => handleReject(track.id)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrackAssignmentList;
