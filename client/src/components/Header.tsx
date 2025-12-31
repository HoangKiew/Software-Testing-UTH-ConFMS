import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Menu as MenuIcon,
    Close as CloseIcon,
    AccountCircle,
    Notifications,
    Settings,
} from '@mui/icons-material';
import iconUth from '../assets/icon_uth.svg';

const Header = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Mock user data - replace with actual auth state later
    const isLoggedIn = true;
    const userName = 'Nguyễn Văn A';

    const navItems = [
        { name: 'Trang chủ', path: '/' },
        { name: 'Hội nghị', path: '/conferences' },
        { name: 'Bài nộp', path: '/my-submissions' },
        { name: 'Cài đặt', path: '/settings' },
    ];

    const handleLogout = () => {
        // TODO: Implement logout logic
        navigate('/login');
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
                        <img src={iconUth} alt="UTH Logo" className="h-10 w-auto" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="text-gray-700 hover:text-[#008689] font-medium transition-colors duration-200 relative group"
                            >
                                {item.name}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#008689] transition-all duration-200 group-hover:w-full"></span>
                            </Link>
                        ))}
                    </nav>

                    {/* Right Side - Auth Buttons / User Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isLoggedIn ? (
                            <>
                                {/* Notifications */}
                                <button className="p-2 text-gray-600 hover:text-[#008689] hover:bg-gray-100 rounded-full transition-colors duration-200 relative">
                                    <Notifications className="w-6 h-6" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        <AccountCircle className="w-8 h-8 text-[#008689]" />
                                        <span className="text-gray-700 font-medium">{userName}</span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <AccountCircle className="w-5 h-5 inline mr-2" />
                                                Hồ sơ
                                            </Link>
                                            <Link
                                                to="/settings"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <Settings className="w-5 h-5 inline mr-2" />
                                                Cài đặt
                                            </Link>
                                            <hr className="my-2" />
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-6 py-2 text-[#008689] font-semibold hover:text-[#006666] transition-colors duration-200"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-6 py-2 bg-[#008689] text-white font-semibold rounded-lg hover:bg-[#006666] transition-colors duration-200 shadow-md hover:shadow-lg"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-600 hover:text-[#008689] hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                        {mobileMenuOpen ? (
                            <CloseIcon className="w-6 h-6" />
                        ) : (
                            <MenuIcon className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <nav className="px-4 py-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="block px-4 py-2 text-gray-700 hover:bg-[#008689] hover:text-white rounded-lg transition-colors duration-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {isLoggedIn ? (
                            <>
                                <hr className="my-2" />
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 text-gray-700 hover:bg-[#008689] hover:text-white rounded-lg transition-colors duration-200"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <AccountCircle className="w-5 h-5 inline mr-2" />
                                    Hồ sơ
                                </Link>
                                <Link
                                    to="/settings"
                                    className="block px-4 py-2 text-gray-700 hover:bg-[#008689] hover:text-white rounded-lg transition-colors duration-200"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Settings className="w-5 h-5 inline mr-2" />
                                    Cài đặt
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                >
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <hr className="my-2" />
                                <Link
                                    to="/login"
                                    className="block px-4 py-2 text-center text-[#008689] font-semibold hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="block px-4 py-2 text-center bg-[#008689] text-white font-semibold rounded-lg hover:bg-[#006666] transition-colors duration-200"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
