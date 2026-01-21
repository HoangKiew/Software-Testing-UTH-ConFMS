import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetTracksQuery,
  useUpdateTrackMutation,
  useDeleteTrackMutation,
} from '../../../redux/api/conferencesApi';
import type { Track } from '../../../types/api.types';
import { showToast } from '../../../utils/toast';
import { formatApiError } from '../../../utils/api-helpers';
import TrackList from './TrackList';
import CreateTrackForm from './CreateTrackForm';

interface TrackDetailProps {
  conferenceId: number;
  onBack: () => void;
}

const TrackDetail = ({ conferenceId, onBack }: TrackDetailProps) => {
  const { data: tracksData, isLoading } = useGetTracksQuery(conferenceId);
  const [updateTrack, { isLoading: isUpdating }] = useUpdateTrackMutation();
  const [deleteTrack] = useDeleteTrackMutation();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editName, setEditName] = useState('');

  const tracks = tracksData?.data && Array.isArray(tracksData.data) ? tracksData.data : [];

  useEffect(() => {
    if (editingTrack) {
      setEditName(editingTrack.name);
    }
  }, [editingTrack]);

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setEditName(track.name);
  };

  const handleCancelEdit = () => {
    setEditingTrack(null);
    setEditName('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;

    try {
      await updateTrack({
        conferenceId,
        trackId: editingTrack.id,
        name: editName,
      }).unwrap();
      showToast.success('Cập nhật chủ đề thành công');
      handleCancelEdit();
    } catch (err) {
      console.error('Error updating track:', err);
      showToast.error(formatApiError(err));
    }
  };

  const handleDelete = async (trackId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chủ đề này không?')) {
      return;
    }

    try {
      await deleteTrack({ conferenceId, trackId }).unwrap();
      showToast.success('Xóa chủ đề thành công');
    } catch (err) {
      console.error('Error deleting track:', err);
      showToast.error(formatApiError(err));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-8">
          <CircularProgress disableShrink />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Danh sách Chủ đề</h2>
        {!showCreateForm && !editingTrack && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            + Thêm chủ đề
          </button>
        )}
      </div>

      {showCreateForm && (
        <CreateTrackForm
          conferenceId={conferenceId}
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingTrack && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-teal-200 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Sửa chủ đề</h2>
            <button
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600"
              title="Hủy"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên chủ đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ví dụ: Trí tuệ nhân tạo & Học máy"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </form>
        </div>
      )}

      <TrackList tracks={tracks} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
};

export default TrackDetail;

