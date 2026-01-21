import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface MenuItem {
  name: string;
  to: string;
  icon?: string;
}

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('ADMIN');

  const menuItems: MenuItem[] = [
    {
      name: 'Thiết lập Hội nghị & CFP',
      to: '/conference-setup',
    },
    {
      name: 'Bài nộp Thí sinh',
      to: '/submissions',
    },
    {
      name: 'Giao việc Phản biện',
      to: '/pc-management',
    },
    {
      name: 'Phản biện & Quyết Định',
      to: '/assignments',
    },
    {
      name: 'Bài từ chối thí sinh',
      to: '/rejected-submissions',
    },
    {
      name: 'Bài hoàn thiện Thí sinh',
      to: '/camera-ready',
    },
    {
      name: 'Báo cáo & Phân tích',
      to: '/reports',
    },
    {
      name: 'Quản lý chủ đề',
      to: '/tracks',
    },
    ...(isAdmin
      ? [
          {
            name: 'Quản lý tài khoản',
            to: '/account-management',
          },
        ]
      : []),
  ];

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    if (path !== '/' && location.pathname.startsWith(path + '/')) return true;
    return false;
  };

  return (
    <div className="w-64 min-h-screen bg-sidebar">
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive(item.to)
                  ? 'text-sidebar-text font-semibold'
                  : 'text-sidebar-text hover:bg-gray-800 hover:text-white'
              }`}
              style={
                isActive(item.to)
                  ? { backgroundColor: '#059669' }
                  : {}
              }
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;



