import { useState } from 'react';
import { useCreateTrackMutation } from '../../../redux/api/conferencesApi';
import { showToast } from '../../../utils/toast';

interface CreateTrackFormProps {
  conferenceId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateTrackForm = ({
  conferenceId,
  onSuccess,
  onCancel,
}: CreateTrackFormProps) => {
  const [name, setName] = useState('');
  const [createTrack, { isLoading: isCreating }] = useCreateTrackMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrack({ conferenceId, name }).unwrap();
      showToast.success(`Tạo chủ đề "${name}" thành công`);
      setName('');
      onSuccess();
    } catch (err) {
      console.error('Error creating track:', err);
      showToast.error('Có lỗi xảy ra khi tạo chủ đề');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-teal-200 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Tạo chủ đề mới</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          title="Ẩn form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên chủ đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Ví dụ: Trí tuệ nhân tạo & Học máy"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Đang tạo...' : 'Tạo chủ đề'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTrackForm;


