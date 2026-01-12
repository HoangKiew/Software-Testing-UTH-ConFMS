import { Link } from 'react-router-dom';
import {
    People,
    Settings,
    Description,
    Assessment,
    CalendarMonth,
    BarChart as BarChartIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
    // Mock data for Admin Dashboard
    const systemStats = [
        {
            label: 'Tổng bài nộp',
            value: '206',
            icon: Description,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            trend: 'Tổng số bài nộp',
        },
        {
            label: 'Tỷ lệ chấp nhận',
            value: '56.5%',
            icon: Assessment,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            trend: 'Tỷ lệ chấp nhận',
        },
        {
            label: 'Phản biện viên',
            value: '45',
            icon: People,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            trend: 'Tổng số phản biện',
        },
        {
            label: 'Thời gian bình quân',
            value: '5.2 ngày',
            icon: CalendarMonth,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            trend: 'Thời gian đánh giá',
        },
    ];

    const quickActions = [
        {
            title: 'Tạo hội nghị mới',
            description: 'Tạo một hội nghị mới trong hệ thống',
            icon: DashboardIcon,
            path: '/chair/conferences/create',
            color: 'text-[#008689]',
            bgColor: 'bg-[#e6f7f7]',
            borderColor: 'border-[#008689]/30',
        },
        {
            title: 'Chức năng Chair',
            description: 'Truy cập tất cả chức năng quản lý hội nghị',
            icon: DashboardIcon,
            path: '/chair/conferences',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
        },
        {
            title: 'Quản lý người dùng',
            description: 'Xem, tạo, sửa, xóa users và phân quyền',
            icon: People,
            path: '/admin/users',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
        },
        {
            title: 'Tất cả hội nghị',
            description: 'Quản lý toàn bộ conferences trong hệ thống',
            icon: CalendarMonth,
            path: '/admin/conferences',
            color: 'text-[#008689]',
            bgColor: 'bg-[#e6f7f7]',
            borderColor: 'border-[#008689]/30',
        },
        {
            title: 'Cài đặt hệ thống',
            description: 'SMTP, quotas, và cấu hình nền tảng',
            icon: Settings,
            path: '/admin/settings',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
        },
    ];

    const recentActivity = [
        {
            id: 1,
            user: 'Nguyễn Văn A',
            action: 'đã tạo hội nghị mới',
            resource: 'ICCS 2026',
            timestamp: '5 phút trước',
        },
        {
            id: 2,
            user: 'Trần Thị B',
            action: 'đã nộp bài báo',
            resource: 'Deep Learning in Healthcare',
            timestamp: '12 phút trước',
        },
        {
            id: 3,
            user: 'Lê Văn C',
            action: 'đã hoàn thành đánh giá',
            resource: 'Paper #234',
            timestamp: '25 phút trước',
        },
        {
            id: 4,
            user: 'Phạm Thị D',
            action: 'đã đăng ký tài khoản',
            resource: 'New User Account',
            timestamp: '1 giờ trước',
        },
        {
            id: 5,
            user: 'Hoàng Văn E',
            action: 'đã cập nhật cài đặt',
            resource: 'SMTP Configuration',
            timestamp: '2 giờ trước',
        },
    ];

    // Data for Bar Chart - Submissions by track
    const submissionsByTrack = [
        { name: 'AI & ML', submissions: 45, reviews: 38, decisions: 32 },
        { name: 'Software Eng', submissions: 38, reviews: 32, decisions: 28 },
        { name: 'Data Science', submissions: 42, reviews: 35, decisions: 30 },
        { name: 'Cybersecurity', submissions: 28, reviews: 24, decisions: 20 },
        { name: 'IoT', submissions: 32, reviews: 28, decisions: 24 },
        { name: 'Cloud Computing', submissions: 21, reviews: 18, decisions: 15 },
    ];

    // Data for Pie Chart - Acceptance rate by type
    const acceptanceData = [
        { name: 'Chấp nhận', value: 116, color: '#10b981' },
        { name: 'Từ chối', value: 68, color: '#ef4444' },
        { name: 'Đang xét', value: 22, color: '#f59e0b' },
    ];

    // Statistics by school
    const schoolStats = [
        { school: 'ĐH Bách Khoa TP.HCM', submissions: 42, reviews: 38, decisions: 35, acceptance: '83%' },
        { school: 'ĐH Khoa học Tự nhiên', submissions: 38, reviews: 35, decisions: 32, acceptance: '84%' },
        { school: 'ĐH Công nghệ', submissions: 35, reviews: 32, decisions: 28, acceptance: '80%' },
        { school: 'ĐH Giao thông Vận tải', submissions: 28, reviews: 25, decisions: 22, acceptance: '79%' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Bảng điều khiển Admin
                    </h1>
                    <p className="text-gray-600">
                        Quản lý toàn bộ hệ thống UTH-ConfMS
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {systemStats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                                {stat.value}
                            </p>
                            <p className="text-sm font-medium text-gray-600 mb-2">
                                {stat.label}
                            </p>
                            <p className="text-xs text-gray-500">
                                {stat.trend}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Chức năng quản trị
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.path}
                                className={`bg-white rounded-lg p-5 border-2 ${action.borderColor} hover:shadow-lg transition-all duration-300 group`}
                            >
                                <div className="flex items-start">
                                    <div className={`${action.bgColor} ${action.color} p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200`}>
                                        <action.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {action.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Bar Chart - Submissions by Track */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Thống kê bài nộp theo phân ban
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={submissionsByTrack}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="submissions" fill="#3b82f6" name="Bài nộp" />
                                <Bar dataKey="reviews" fill="#10b981" name="Đã đánh giá" />
                                <Bar dataKey="decisions" fill="#f59e0b" name="Quyết định" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Chart - Acceptance Rate */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Tỷ lệ chấp nhận theo loại
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={acceptanceData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {acceptanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Statistics Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Thống kê theo trường
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trường
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bài nộp
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đánh giá
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quyết định
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tỷ lệ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {schoolStats.map((school, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {school.school}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                            {school.submissions}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                            {school.reviews}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                            {school.decisions}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                {school.acceptance}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Hoạt động gần đây
                        </h2>
                        <Link
                            to="/admin/audit-logs"
                            className="text-sm text-[#008689] hover:text-[#006666] font-medium"
                        >
                            Xem tất cả →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
                            >
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-semibold">{activity.user}</span>
                                        {' '}{activity.action}
                                        {' '}
                                        <span className="text-[#008689] font-medium">
                                            {activity.resource}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {activity.timestamp}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
