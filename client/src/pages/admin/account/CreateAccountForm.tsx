import { useState } from 'react';
import { useCreateUserMutation } from '../../../redux/api/usersApi';
import { showToast } from '../../../utils/toast';
import type { CreateUserRequest } from '../../../redux/api/usersApi';

interface CreateAccountFormProps {
  onSuccess: (userId: number) => void;
  onCancel: () => void;
}

const CreateAccountForm = ({ onSuccess, onCancel }: CreateAccountFormProps) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    fullName: '',
    role: 'AUTHOR',
  });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createUser(formData).unwrap();
      const userName = formData.fullName || formData.email;
      showToast.success(`Tạo tài khoản "${userName}" thành công`);
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'AUTHOR',
      });
      onSuccess(result.data.id);
    } catch (err) {
      console.error('Error creating user:', err);
      showToast.error('Có lỗi xảy ra khi tạo tài khoản');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-teal-200 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Tạo tài khoản mới</h2>
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
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            required
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Tối thiểu 6 ký tự"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vai trò <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="AUTHOR">Tác giả (AUTHOR)</option>
            <option value="REVIEWER">Phản biện (REVIEWER)</option>
            <option value="PC_MEMBER">Thành viên PC (PC_MEMBER)</option>
            <option value="CHAIR">Chủ tịch (CHAIR)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>
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
            {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAccountForm;

