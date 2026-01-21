import type { TrackMember, User } from '../../../types/api.types';

interface MemberWithUser extends TrackMember {
  user: User | null;
}

interface PCMemberListProps {
  members: MemberWithUser[];
  onDelete: (userId: number) => void;
}

const PCMemberList = ({ members, onDelete }: PCMemberListProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Chưa có dữ liệu';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  };

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Chưa có thành viên nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member: MemberWithUser) => (
        <div
          key={member.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {member.user?.fullName || member.user?.email || `User ID: ${member.userId}`}
              </h2>
              {member.user?.email && (
                <p className="text-gray-600 mb-2">{member.user.email}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Ngày thêm:</span>{' '}
                  {formatDate(member.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={() => onDelete(member.userId)}
                className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                title="Xóa thành viên"
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

export default PCMemberList;


