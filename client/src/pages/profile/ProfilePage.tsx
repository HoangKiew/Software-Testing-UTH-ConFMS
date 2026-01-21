import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import bgUth from '../../assets/bg_uth.svg';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const formatRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: 'Quản trị viên',
      CHAIR: 'Chủ tịch hội nghị',
      PC_MEMBER: 'Thành viên ban chương trình',
      AUTHOR: 'Tác giả',
      REVIEWER: 'Người phản biện',
    };
    return roleMap[role] || role;
  };

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

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
          <div className="flex justify-center items-center py-8">
            <CircularProgress disableShrink />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgUth})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="p-6 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Quay lại
            </button>

            <h1 className="text-xl md:text-3xl font-bold text-gray-800">
              Thông tin tài khoản
            </h1>

            <div />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center md:items-start">
                <div className="w-40 h-40 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-4xl font-bold mb-4">
                  {user.fullName
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) ||
                    user.email?.[0].toUpperCase() ||
                    'U'}
                </div>
                <p className="text-lg font-semibold mb-1">
                  {user.fullName || user.email}
                </p>
                <p className="text-sm text-gray-500 mb-4">{user.email}</p>
                <div className="mt-2">
                  <button
                    onClick={() => navigate('/change-password')}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <p className="text-gray-900 text-lg">
                      {user.fullName || 'Chưa có thông tin'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 text-lg">{user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium"
                          >
                            {formatRoleName(role)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">Chưa có vai trò</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái xác thực
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày tạo tài khoản
                      </label>
                      <p className="text-gray-900">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cập nhật lần cuối
                      </label>
                      <p className="text-gray-900">
                        {formatDate(user.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;





