import { Link } from 'react-router-dom';
import {
    Add,
    Visibility,
    Edit,
    People,
    CheckCircle,
    TrendingUp,
    CalendarMonth
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useGetConferencesQuery } from '../../redux/api/conferencesApi';

interface ChairDashboardProps {
    currentRole?: string;
}

const ChairDashboard = ({ currentRole }: ChairDashboardProps) => {
    // Fetch conferences from API
    const { data: conferencesData, isLoading, error } = useGetConferencesQuery();
    const { user } = useAuth();

    // Determine if current user is admin
    const isAdmin = (() => {
        if (currentRole) {
            return currentRole.toLowerCase() === 'admin';
        }
        const rolesInput = user?.roles as any;
        let roles: string[] = [];
        if (Array.isArray(rolesInput)) {
            roles = (rolesInput as any[])
                .map((r: any) => (typeof r === 'string' ? r : r?.name ?? r?.role ?? r?.value))
                .filter(Boolean)
                .map((s: string) => s.toString().toLowerCase().replace(/^role_/, '').trim());
        } else if (typeof rolesInput === 'string') {
            roles = [(rolesInput as string).toLowerCase().replace(/^role_/, '').trim()];
        }
        return roles.includes('admin');
    })();
    
    // Map API data to component format
    const apiConferences = Array.isArray(conferencesData) ? conferencesData : (conferencesData?.data || []);
    
    const myConferences = apiConferences.map((conf: any) => ({
        id: conf.id,
        name: conf.name,
        acronym: conf.acronym,
        startDate: conf.startDate,
        endDate: conf.endDate,
        status: conf.status === 'draft' ? 'Draft' : conf.status === 'active' ? 'Active' : 'Closed',
        statusColor: conf.status === 'draft' ? 'text-gray-600 bg-gray-50' : 
                     conf.status === 'active' ? 'text-green-600 bg-green-50' : 
                     'text-red-600 bg-red-50',
        submissions: 0, // These would come from another API
        reviews: 0,
        decisions: 0,
    }));

    // Only display first 3 conferences
    const displayConferences = myConferences.slice(0, 3);

    return (
        <div>
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-white">
                        <h1 className="text-5xl font-bold mb-4">
                            Bảng cài đặt của UTH
                        </h1>
                        <p className="text-xl text-white/90 mb-8">
                            Cấu hình và quản trị nền tảng UTH-ConfMS
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white py-12 px-6 border-b border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Thao tác nhanh
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            to="/chair/conferences/create"
                            className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center"
                        >
                            <Add className="w-12 h-12 text-[#008689] mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-1">
                                Tạo hội nghị
                            </h3>
                            <p className="text-xs text-gray-600">
                                Bắt đầu hội nghị mới
                            </p>
                        </Link>

                        <Link
                            to="/chair/assignments"
                            className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center"
                        >
                            <People className="w-12 h-12 text-[#008689] mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-1">
                                Phân công bài báo
                            </h3>
                            <p className="text-xs text-gray-600">
                                Assign papers to reviewers
                            </p>
                        </Link>

                        <Link
                            to="/chair/decisions"
                            className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center"
                        >
                            <CheckCircle className="w-12 h-12 text-[#008689] mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-1">
                                Đưa ra quyết định
                            </h3>
                            <p className="text-xs text-gray-600">
                                Accept/Reject papers
                            </p>
                        </Link>

                        <Link
                            to="/chair/progress"
                            className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center"
                        >
                            <TrendingUp className="w-12 h-12 text-[#008689] mb-3" />
                            <h3 className="font-semibold text-gray-900 mb-1">
                                Theo dõi tiến độ
                            </h3>
                            <p className="text-xs text-gray-600">
                                Track review progress
                            </p>
                        </Link>

                        {/* Show user-management quick action for Admin users */}
                        {isAdmin && (
                            <Link
                                to="/admin/users"
                                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all duration-300 text-center"
                            >
                                <People className="w-12 h-12 text-[#008689] mb-3" />
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Quản lý người dùng
                                </h3>
                                <p className="text-xs text-gray-600">
                                    Xem, tạo, sửa, xóa người dùng
                                </p>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-gray-50 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* My Conferences */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Hội nghị của tôi
                            </h2>
                            <Link
                                to="/chair/conferences"
                                className="text-[#008689] hover:text-[#006666] font-medium text-sm"
                            >
                                Xem tất cả →
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#008689]"></div>
                                    <p className="mt-2 text-gray-600">Đang tải...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <p className="text-red-600">Không thể tải danh sách hội nghị</p>
                                </div>
                            ) : myConferences.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-600">Bạn chưa có hội nghị nào</p>
                                    <Link
                                        to="/chair/conferences/create"
                                        className="inline-block mt-4 px-6 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666]"
                                    >
                                        Tạo hội nghị đầu tiên
                                    </Link>
                                </div>
                            ) : (
                                <>
                            {displayConferences.map((conf) => (
                                <div
                                    key={conf.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:border-[#008689] hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {conf.acronym}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${conf.statusColor}`}
                                                >
                                                    {conf.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mb-2">{conf.name}</p>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <CalendarMonth className="w-4 h-4 mr-1" />
                                                {new Date(conf.startDate).toLocaleDateString('vi-VN')} - {new Date(conf.endDate).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#008689]">{conf.submissions}</p>
                                            <p className="text-xs text-gray-600">Bài nộp</p>
                                        </div>
                                        <div className="text-center border-l border-r border-gray-300">
                                            <p className="text-2xl font-bold text-blue-600">{conf.reviews}</p>
                                            <p className="text-xs text-gray-600">Đánh giá</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">{conf.decisions}</p>
                                            <p className="text-xs text-gray-600">Quyết định</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/chair/conferences/${conf.id}`}
                                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                                        >
                                            <Visibility className="w-4 h-4 mr-2" />
                                            Xem
                                        </Link>
                                        <Link
                                            to={`/chair/conferences/${conf.id}/edit`}
                                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-[#008689] text-[#008689] font-medium rounded-lg hover:bg-[#008689] hover:text-white transition-colors duration-200 text-sm"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Sửa
                                        </Link>
                                        <Link
                                            to={`/chair/conferences/${conf.id}/pc-members`}
                                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#008689] text-white font-medium rounded-lg hover:bg-[#006666] transition-colors duration-200 text-sm"
                                        >
                                            <People className="w-4 h-4 mr-2" />
                                            Quản lý PC
                                        </Link>
                                    </div>
                                </div>
                            ))}
                                </>
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default ChairDashboard;
