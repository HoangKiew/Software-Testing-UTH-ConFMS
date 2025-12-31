import { Link } from 'react-router-dom';
import {
    CalendarMonth,
    Description,
    RateReview,
    TrendingUp,
} from '@mui/icons-material';
import adsUth from '../../assets/ads_uth.svg';
import imageUth from '../../assets/image-uth.jpg';

const HomePage = () => {
    // Mock data for demonstration
    const stats = [
        {
            title: 'Hội nghị đang mở',
            value: '8',
            icon: <CalendarMonth className="w-8 h-8" />,
            color: 'bg-blue-500',
            link: '/conferences',
        },
        {
            title: 'Bài nộp của tôi',
            value: '5',
            icon: <Description className="w-8 h-8" />,
            color: 'bg-green-500',
            link: '/my-submissions',
        },
        {
            title: 'Đánh giá chờ xử lý',
            value: '3',
            icon: <RateReview className="w-8 h-8" />,
            color: 'bg-orange-500',
            link: '/reviews',
        },
        {
            title: 'Tỷ lệ chấp nhận',
            value: '75%',
            icon: <TrendingUp className="w-8 h-8" />,
            color: 'bg-purple-500',
            link: '/statistics',
        },
    ];

    const recentConferences = [
        {
            id: 1,
            name: 'Hội nghị Khoa học Công nghệ UTH 2026',
            acronym: 'UTHCONF2026',
            deadline: '2026-04-01',
            status: 'Đang mở nộp bài',
            statusColor: 'text-green-600 bg-green-50',
        },
        {
            id: 2,
            name: 'International Conference on AI & Machine Learning',
            acronym: 'ICAIML2026',
            deadline: '2026-03-15',
            status: 'Sắp đóng',
            statusColor: 'text-orange-600 bg-orange-50',
        },
        {
            id: 3,
            name: 'Vietnam Software Engineering Conference',
            acronym: 'VSEC2026',
            deadline: '2026-05-20',
            status: 'Đang mở nộp bài',
            statusColor: 'text-green-600 bg-green-50',
        },
    ];

    const mySubmissions = [
        {
            id: 1,
            title: 'Ứng dụng Deep Learning trong nhận diện khuôn mặt',
            conference: 'UTHCONF2026',
            status: 'Đang đánh giá',
            statusColor: 'text-blue-600 bg-blue-50',
            submittedDate: '2025-12-15',
        },
        {
            id: 2,
            title: 'Phân tích dữ liệu lớn với Apache Spark',
            conference: 'ICAIML2026',
            status: 'Đã chấp nhận',
            statusColor: 'text-green-600 bg-green-50',
            submittedDate: '2025-12-10',
        },
    ];

    return (
        <div>
            {/* Hero/Introduction Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Side - Text Content */}
                        <div className="space-y-6">
                            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                UTH Scientific Conference Paper Management System
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Hệ thống quản lý giấy tờ Hội nghị Nghiên cứu khoa học dành cho Trường Đại Học UTH
                            </p>
                            <div className="flex items-center space-x-4 pt-4">
                                <Link
                                    to="/conferences"
                                    className="px-8 py-4 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Khám phá ngay
                                </Link>
                                <Link
                                    to="/about"
                                    className="px-8 py-4 border-2 border-[#008689] text-[#008689] hover:bg-[#008689] hover:text-white font-semibold rounded-lg transition-all duration-200"
                                >
                                    Tìm hiểu thêm
                                </Link>
                            </div>

                            {/* Dots Indicator */}
                            <div className="flex items-center space-x-2 pt-8">
                                <div className="w-3 h-3 rounded-full bg-[#008689]"></div>
                                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            </div>
                        </div>

                        {/* Right Side - Illustration */}
                        <div className="relative flex justify-center">
                            <div className="relative z-10 max-w-lg">
                                <img
                                    src={adsUth}
                                    alt="Conference Management System Illustration"
                                    className="w-full h-auto"
                                />
                            </div>
                            {/* Decorative Elements */}
                            <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-[#008689] opacity-5 rounded-full blur-3xl"></div>
                            <div className="absolute -top-4 -left-4 w-64 h-64 bg-blue-500 opacity-5 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white py-12 px-6 border-b border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, index) => (
                            <Link
                                key={index}
                                to={stat.link}
                                className="bg-white rounded-xl shadow-md hover:shadow-xl hover:border-[#008689] border-2 border-transparent transition-all duration-300 p-6 cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium mb-1">
                                            {stat.title}
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div
                                        className={`${stat.color} text-white p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}
                                    >
                                        {stat.icon}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="bg-gray-50 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Conferences */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Hội nghị gần đây
                                </h2>
                                <Link
                                    to="/conferences"
                                    className="text-[#008689] hover:text-[#006666] font-medium text-sm"
                                >
                                    Xem tất cả →
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {recentConferences.map((conf) => (
                                    <div
                                        key={conf.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-[#008689] hover:shadow-md transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">
                                                    {conf.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{conf.acronym}</p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${conf.statusColor}`}
                                            >
                                                {conf.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 mt-3">
                                            <CalendarMonth className="w-4 h-4 mr-2" />
                                            Deadline: {new Date(conf.deadline).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* My Submissions */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Bài nộp của tôi
                                </h2>
                                <Link
                                    to="/my-submissions"
                                    className="text-[#008689] hover:text-[#006666] font-medium text-sm"
                                >
                                    Xem tất cả →
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {mySubmissions.map((submission) => (
                                    <div
                                        key={submission.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-[#008689] hover:shadow-md transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900 flex-1 pr-4">
                                                {submission.title}
                                            </h3>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${submission.statusColor}`}
                                            >
                                                {submission.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                                            <span className="font-medium">{submission.conference}</span>
                                            <span>
                                                {new Date(submission.submittedDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Quick Action Button */}
                                <Link
                                    to="/submission"
                                    className="block w-full mt-4 bg-[#008689] hover:bg-[#006666] text-white text-center font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                                >
                                    + Nộp bài mới
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Thao tác nhanh
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link
                                to="/conferences"
                                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300"
                            >
                                <CalendarMonth className="w-8 h-8 text-[#008689] mr-4" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        Tìm hội nghị
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Khám phá các hội nghị đang mở
                                    </p>
                                </div>
                            </Link>

                            <Link
                                to="/submission"
                                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300"
                            >
                                <Description className="w-8 h-8 text-[#008689] mr-4" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Nộp bài báo</h3>
                                    <p className="text-sm text-gray-600">
                                        Upload bài báo của bạn
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* About UTH-ConfMS Section */}
            <div className="bg-white py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                        {/* Left Side - Image */}
                        <div className="relative flex justify-center lg:justify-start">
                            <img
                                src={imageUth}
                                alt="Trường Đại học Giao thông Vận tải TP.HCM"
                                className="w-full max-w-md h-auto rounded-lg shadow-xl"
                            />
                        </div>

                        {/* Right Side - Description */}
                        <div className="space-y-6">
                            <h2 className="text-4xl font-bold text-gray-900">
                                UTH-ConfMS
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Hệ thống quản lý hội nghị khoa học chuyên nghiệp dành cho Trường Đại học Giao thông Vận tải TP.HCM.
                            </p>
                            <Link
                                to="/about"
                                className="inline-block px-8 py-3 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
