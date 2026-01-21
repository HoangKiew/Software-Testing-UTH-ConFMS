import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useAddTrackMemberMutation } from '../../../redux/api/conferencesApi';
import { useGetUsersQuery } from '../../../redux/api/usersApi';
import type { User } from '../../../types/api.types';
import { showToast } from '../../../utils/toast';

interface CreatePCMemberFormProps {
  trackId: number;
  existingMemberIds: number[];
  onSuccess: () => void;
  onCancel: () => void;
}

const CreatePCMemberForm = ({
  trackId,
  existingMemberIds,
  onSuccess,
  onCancel,
}: CreatePCMemberFormProps) => {
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [addMember, { isLoading: isAdding }] = useAddTrackMemberMutation();
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery();

  const users = usersData?.data && Array.isArray(usersData.data) ? usersData.data : [];
  
  // Filter users: chỉ hiển thị REVIEWER và PC_MEMBER
  const eligibleUsers = users.filter((user: User) => {
    const roles = user.roles || [];
    return roles.includes('REVIEWER') || roles.includes('PC_MEMBER');
  });
  
  // Filter out users who are already members
  const availableUsers = eligibleUsers.filter(
    (user: User) => !existingMemberIds.includes(user.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast.warning('Vui lòng chọn người dùng');
      return;
    }

    try {
      await addMember({ trackId, userId: Number(selectedUserId) }).unwrap();
      const selectedUser = availableUsers.find((u: User) => u.id === Number(selectedUserId));
      const userName = selectedUser?.fullName || selectedUser?.email || 'thành viên';
      showToast.success(`Thêm ${userName} vào ban chương trình thành công`);
      setSelectedUserId('');
      onSuccess();
    } catch (err: any) {
      console.error('Error adding member:', err);
      const errorMessage = err?.data?.message || 'Có lỗi xảy ra khi thêm thành viên';
      showToast.error(errorMessage);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-teal-200 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Thêm thành viên Ban Chương trình</h2>
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
            Chọn người dùng <span className="text-red-500">*</span>
          </label>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-4">
              <CircularProgress size={24} disableShrink />
            </div>
          ) : availableUsers.length === 0 ? (
            <p className="text-gray-600">Không còn người dùng nào để thêm</p>
          ) : (
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Chọn người dùng --</option>
              {availableUsers.map((user: User) => {
                const roles = user.roles || [];
                const roleLabels = roles
                  .filter((r: string) => r === 'REVIEWER' || r === 'PC_MEMBER')
                  .map((r: string) => {
                    if (r === 'REVIEWER') return 'Reviewer';
                    if (r === 'PC_MEMBER') return 'PC Member';
                    return r;
                  })
                  .join(', ');
                const displayName = user.fullName || user.email;
                const emailDisplay = user.email && user.fullName ? ` (${user.email})` : '';
                const roleDisplay = roleLabels ? ` (${roleLabels})` : '';
                
                return (
                  <option key={user.id} value={user.id}>
                    {displayName}{roleDisplay}{emailDisplay}
                  </option>
                );
              })}
            </select>
          )}
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
            disabled={isAdding || availableUsers.length === 0}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Đang thêm...' : 'Thêm thành viên'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePCMemberForm;

