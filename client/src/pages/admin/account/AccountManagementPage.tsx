import { useState, useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useGetUsersQuery,
  useDeleteUserMutation,
} from '../../../redux/api/usersApi';
import type { User } from '../../../types/api.types';
import { showToast } from '../../../utils/toast';
import { formatApiError } from '../../../utils/api-helpers';
import CreateAccountForm from './CreateAccountForm';
import AccountList from './AccountList';
import AccountDetail from './AccountDetail';

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const AccountManagementPage = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading, error } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();

  const users = useMemo(() => {
    return (data?.data && Array.isArray(data.data)) ? data.data : [];
  }, [data]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }

    const normalizedQuery = removeVietnameseTones(searchQuery);
    return users.filter((user: User) => {
      const normalizedEmail = removeVietnameseTones(user.email);
      const normalizedFullName = user.fullName
        ? removeVietnameseTones(user.fullName)
        : '';
      const normalizedRoles = user.roles
        ? user.roles.map((r) => removeVietnameseTones(r)).join(' ')
        : '';

      return (
        normalizedEmail.includes(normalizedQuery) ||
        normalizedFullName.includes(normalizedQuery) ||
        normalizedRoles.includes(normalizedQuery)
      );
    });
  }, [users, searchQuery]);

  const handleCreateSuccess = (userId: number) => {
    setShowCreateForm(false);
    setSelectedUserId(userId);
    setView('detail');
  };

  const handleViewDetail = (userId: number) => {
    setSelectedUserId(userId);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedUserId(null);
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
      return;
    }

    try {
      await deleteUser(userId).unwrap();
      showToast.success('Xóa tài khoản thành công');
      if (selectedUserId === userId) {
        handleBackToList();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast.error(formatApiError(err));
    }
  };

  if (view === 'detail' && selectedUserId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý tài khoản
            </h1>
          </div>
        </div>
        <AccountDetail userId={selectedUserId} onBack={handleBackToList} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý tài khoản</h1>
        <div className="relative flex items-center space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài khoản..."
            className="px-4 py-2 border text-text-main font-medium border-primary rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center shadow-lg hover:bg-teal-700 transition-colors cursor-pointer"
            title={showCreateForm ? 'Ẩn form tạo tài khoản' : 'Tạo tài khoản mới'}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showCreateForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'}
              />
            </svg>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center py-8">
            <CircularProgress disableShrink />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Có lỗi xảy ra khi tải danh sách tài khoản</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {showCreateForm && (
            <CreateAccountForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          <AccountList
            users={filteredUsers}
            searchQuery={searchQuery}
            onViewDetail={handleViewDetail}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
};

export default AccountManagementPage;

