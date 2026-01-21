import type { User } from '../../../types/api.types';

interface AccountListProps {
  users: User[];
  searchQuery: string;
  onViewDetail: (userId: number) => void;
  onDelete: (userId: number) => void;
}

const AccountList = ({
  users,
  searchQuery,
  onViewDetail,
  onDelete,
}: AccountListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

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

  const formatRoles = (roles: string[]): string => {
    if (!roles || roles.length === 0) return 'Chưa có';
    return roles.map(formatRoleName).join(', ');
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          {searchQuery ? 'Không tìm thấy tài khoản nào' : 'Chưa có tài khoản nào'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user: User) => (
        <div
          key={user.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {user.fullName || user.email}
              </h2>
              <div className="text-gray-600 mb-2">
                <span className="font-medium">Email:</span> {user.email}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Vai trò:</span>{' '}
                  {formatRoles(user.roles || [])}
                </div>
                <div>
                  <span className="font-medium">Trạng thái:</span>{' '}
                  <span className={user.isVerified ? 'text-green-600' : 'text-orange-600'}>
                    {user.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Ngày tạo:</span>{' '}
                  {formatDate(user.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={() => onViewDetail(user.id)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Chi tiết
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                title="Xóa tài khoản"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountList;

