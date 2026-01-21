import { useState } from 'react';
import { useCreateConferenceMutation } from '../../../redux/api/conferencesApi';
import { showToast } from '../../../utils/toast';

interface CreateConferenceFormProps {
  onSuccess: (conferenceId: number) => void;
  onCancel: () => void;
}

const CreateConferenceForm = ({ onSuccess, onCancel }: CreateConferenceFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    venue: '',
    description: '',
    shortDescription: '',
    contactEmail: '',
  });
  
  const [createConference, { isLoading: isCreating }] = useCreateConferenceMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createConference({
        name: formData.name,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        venue: formData.venue,
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || undefined,
        contactEmail: formData.contactEmail || undefined,
      }).unwrap();
      
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        venue: '',
        description: '',
        shortDescription: '',
        contactEmail: '',
      });

      if (result.data?.id) {
        showToast.success(`Tạo hội nghị "${formData.name}" thành công`);
        onSuccess(result.data.id);
      }
    } catch (err) {
      console.error('Error creating conference:', err);
      showToast.error('Có lỗi xảy ra khi tạo hội nghị');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-teal-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Tạo hội nghị mới</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên hội nghị <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="International UTH Conference 2025"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa điểm <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="HCMC University of Transport"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả chi tiết
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Mô tả về hội nghị..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả ngắn (cho trang CFP)
          </label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Mô tả ngắn gọn (tối đa 500 ký tự)..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.shortDescription.length}/500 ký tự
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email liên hệ
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="conference@uth.edu.vn"
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
            {isCreating ? 'Đang tạo...' : 'Tạo hội nghị'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateConferenceForm;

