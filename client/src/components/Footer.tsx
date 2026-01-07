import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Instagram,
    Twitter,
    YouTube,
    Facebook,
    Send,
} from '@mui/icons-material';
import iconUth from '../assets/icon_uth.svg';

const Footer = () => {
    const [email, setEmail] = useState('');

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement newsletter subscription
        console.log('Subscribe email:', email);
        setEmail('');
    };

    const companyLinks = [
        { name: 'Giới thiệu', path: '/about' },
        { name: 'Tin tức', path: '/news' },
        { name: 'Liên hệ', path: '/contact' },
        { name: 'Hướng dẫn', path: '/guide' },
    ];

    const supportLinks = [
        { name: 'Trung tâm trợ giúp', path: '/help' },
        { name: 'Điều khoản dịch vụ', path: '/terms' },
        { name: 'Chính sách bảo mật', path: '/privacy' },
        { name: 'Câu hỏi thường gặp', path: '/faq' },
    ];

    const socialLinks = [
        { icon: <Facebook className="w-5 h-5" />, url: 'https://facebook.com/uth.edu.vn', label: 'Facebook' },
        { icon: <Instagram className="w-5 h-5" />, url: 'https://instagram.com/uth.edu.vn', label: 'Instagram' },
        { icon: <Twitter className="w-5 h-5" />, url: 'https://twitter.com/uth.edu.vn', label: 'Twitter' },
        { icon: <YouTube className="w-5 h-5" />, url: 'https://youtube.com/@uth.edu.vn', label: 'YouTube' },
    ];

    return (
        <footer className="bg-[#263238] text-gray-300">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Main Footer Content - Logo Left, 3 Columns Right */}
                <div className="flex flex-col lg:flex-row lg:justify-between gap-12">
                    {/* Left Side - Logo & Copyright Section */}
                    <div className="lg:w-1/3 space-y-4">
                        <Link to="/" className="inline-block">
                            <img src={iconUth} alt="UTH Logo" className="h-12 w-auto" />
                        </Link>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400">
                                Copyright © {new Date().getFullYear()} UTH-ConfMS
                            </p>
                            <p className="text-sm text-gray-400">
                                All rights reserved
                            </p>
                        </div>

                        {/* Social Media Icons */}
                        <div className="flex items-center space-x-4 pt-4">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#37474f] hover:bg-[#008689] text-gray-300 hover:text-white transition-all duration-300"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Right Side - 3 Columns */}
                    <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Company Links */}
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-4">Hệ thống</h3>
                            <ul className="space-y-3">
                                {companyLinks.map((link, index) => (
                                    <li key={index}>
                                        <Link
                                            to={link.path}
                                            className="text-gray-400 hover:text-[#008689] transition-colors duration-200 text-sm"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Support Links */}
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-4">Hỗ trợ</h3>
                            <ul className="space-y-3">
                                {supportLinks.map((link, index) => (
                                    <li key={index}>
                                        <Link
                                            to={link.path}
                                            className="text-gray-400 hover:text-[#008689] transition-colors duration-200 text-sm"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter Subscription */}
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-4">
                                Cập nhật thông tin
                            </h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Nhận thông báo về hội nghị mới
                            </p>
                            <form onSubmit={handleSubscribe} className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email của bạn"
                                    className="w-full px-4 py-3 pr-12 bg-[#37474f] text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] transition-all duration-200"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#008689] hover:bg-[#006666] text-white rounded-md transition-colors duration-200"
                                    aria-label="Subscribe"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
