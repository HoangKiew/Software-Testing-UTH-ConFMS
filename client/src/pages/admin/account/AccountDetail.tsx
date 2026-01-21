import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetUserByIdQuery,
  useUpdateUserRolesMutation,
} from '../../../redux/api/usersApi';
import { showToast } from '../../../utils/toast';

interface AccountDetailProps {
  userId: number;
  onBack: () => void;
}

const AccountDetail = ({ userId }: AccountDetailProps) => {
  const { data: userDetail, isLoading } = useGetUserByIdQuery(userId);
  const [updateUserRoles, { isLoading: isUpdating }] =
    useUpdateUserRolesMutation();

  const formatRoleName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      ADMIN: 'Quản trị viên',
      CHAIR: 'Chủ tịch',
      AUTHOR: 'Tác giả',
      REVIEWER: 'Phản biện',
      PC_MEMBER: 'Thành viên PC',
    };
    return roleMap[role] || role;
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'AUTHOR' as 'ADMIN' | 'CHAIR' | 'AUTHOR' | 'REVIEWER' | 'PC_MEMBER',
  });

  useEffect(() => {
    if (userDetail?.data) {
      const user = userDetail.data;
      const firstRole = Array.isArray(user.roles) && user.roles.length > 0 
        ? user.roles[0] 
        : 'AUTHOR';
      setFormData({
        fullName: user.fullName || '',
        email: user.email,
        role: firstRole as 'ADMIN' | 'CHAIR' | 'AUTHOR' | 'REVIEWER' | 'PC_MEMBER',
      });
    }
  }, [userDetail]);

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserRoles({
        userId,
        data: { role: formData.role },
      }).unwrap();

      showToast.success('Cập nhật vai trò thành công');
    } catch (err) {
      console.error('Error updating user role:', err);
      showToast.error('Có lỗi xảy ra khi cập nhật vai trò');
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

  const user = userDetail?.data;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Thông tin Tài khoản
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={formData.fullName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò hiện tại
              </label>
              <input
                type="text"
                value={
                  user?.roles && user.roles.length > 0
                    ? formatRoleName(user.roles[0])
                    : 'Chưa có'
                }
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái xác minh
              </label>
              <input
                type="text"
                value={user?.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                disabled
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed ${
                  user?.isVerified ? 'text-green-600' : 'text-orange-600'
                }`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày tạo
              </label>
              <input
                type="text"
                value={
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                    : ''
                }
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Cập nhật Vai trò
        </h2>
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="AUTHOR">Tác giả (AUTHOR)</option>
              <option value="REVIEWER">Phản biện (REVIEWER)</option>
              <option value="PC_MEMBER">Thành viên PC (PC_MEMBER)</option>
              <option value="CHAIR">Chủ tịch (CHAIR)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Đang cập nhật...' : 'Cập nhật vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountDetail;

