import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import iconUth from '../assets/icon_uth.svg';

const HeaderStudent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/home');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const initials =
    user?.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    user?.email?.[0].toUpperCase() ||
    'U';

  return (
    <header className="bg-primary text-text-main shadow-md">
      <div className="flex items-center justify-between px-6 py-4 gap-5">
        <div className="flex items-center w-52 gap-5">
        <button
          onClick={() => {
            setIsMobileMenuOpen(!isMobileMenuOpen);
            setIsDropdownOpen(false); 
          }}
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors hover:cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
          <Link to="/home">
            <img
              className="w-full h-auto"
              src={iconUth}
              alt="UTH - Trường Giao Thông Vận Tải TPHCM"
            />
          </Link>
        </div>
        
        

        {/* Desktop */}
        <nav className="hidden md:flex items-center text-white ">
          <Link to="/home" className="p-4 rounded-lg transition-colors text-lg hover:text-hover hover:font-semibold">
            Trang chủ
          </Link>
          <Link
            to="/student"
            className="p-4 rounded-lg transition-colors text-lg hover:text-hover hover:font-semibold"
          >
            Nộp bài
          </Link>
          <Link
            to="/reviewer"
            className="p-4 rounded-lg transition-colors text-lg hover:text-hover hover:font-semibold"
          >
            Phản biện
          </Link>
          <button
            onClick={() => scrollToSection('conferences')}
            className="p-4 rounded-lg transition-colors text-lg hover:text-hover hover:font-semibold cursor-pointer"
          >
            Cuộc thi
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="p-4 rounded-lg transition-colors text-lg hover:text-hover hover:font-semibold cursor-pointer"
          >
            Liên hệ
          </button>
        </nav>

        {/* Mobile*/}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <nav className="fixed top-16 left-0 right-0 bg-primary text-white z-50 md:hidden shadow-lg">
              <div className="flex flex-col py-2">
                <Link
                  to="/home"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-3 hover:bg-white/10 transition-colors text-lg"
                >
                  Trang chủ
                </Link>
                <Link
                  to="/student"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-3 hover:bg-white/10 transition-colors text-lg"
                >
                  Nộp bài
                </Link>
                <Link
                  to="/reviewer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-3 hover:bg-white/10 transition-colors text-lg"
                >
                  Phản biện
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToSection('conferences');
                  }}
                  className="px-6 py-3 hover:bg-white/10 transition-colors text-lg text-left"
                >
                  Cuộc thi
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToSection('contact');
                  }}
                  className="px-6 py-3 hover:bg-white/10 transition-colors text-lg text-left"
                >
                  Liên hệ
                </button>
              </div>
            </nav>
          </>
        )}

        <div className="flex items-center">
          <div className="relative">
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsMobileMenuOpen(false); 
              }}
              className="flex items-center gap-2 bg-transparent hover:bg-white/10 text-white transition-colors rounded-md px-4 py-2"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                {initials}
              </div>
              <span className="hidden md:block">
                {user?.fullName || user?.email}
              </span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Xem thông tin tài khoản
                    </button>
                    <button
                      onClick={() => {
                        navigate('/change-password');
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đổi mật khẩu
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderStudent;
