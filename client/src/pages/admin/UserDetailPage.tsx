import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    ArrowBack,
    Edit,
    Delete,
    Email,
    CalendarMonth,
    Description,
    Assessment,
    Event,
    CheckCircle,
} from '@mui/icons-material';
import { useGetUserByIdQuery, useDeleteUserMutation } from '../../redux/api/usersApi';
import { showToast } from '../../utils/toast.ts';
import CircularProgress from '@mui/material/CircularProgress';

interface UserActivity {
    id: number;
    type: 'submission' | 'review' | 'conference' | 'decision';
    title: string;
    description: string;
    date: string;
    status?: string;
}

const UserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const userId = Number(id);
    
    const { data: userData, isLoading, error } = useGetUserByIdQuery(userId);
    const [deleteUser, { isLoading: _isDeleting }] = useDeleteUserMutation();
    const [activeTab, setActiveTab] = useState('overview');


    // Activity history - will be integrated when API is available
    const activities: UserActivity[] = [];

    const user = userData?.data ? {
        id: userData.data.id,
        name: userData.data.fullName || '',
        email: userData.data.email || '',
        roles: Array.isArray(userData.data.roles)
            ? userData.data.roles.map(r => typeof r === 'string' ? r : r)
            : [],
        status: 'Active', 
        createdAt: userData.data.createdAt || new Date().toISOString(),
        totalSubmissions: 0, // Will be populated when API is integrated
        totalReviews: 0, // Will be populated when API is integrated
        totalConferences: 0, // Will be populated when API is integrated
        totalDecisions: 0, // Will be populated when API is integrated
    } : null;

    const handleDelete = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
            try {
                await deleteUser(userId).unwrap();
                showToast.success('Xóa người dùng thành công!');
                navigate('/admin/users');
            } catch (err: any) {
                const errorMessage = err?.data?.message || 'Có lỗi xảy ra khi xóa người dùng';
                showToast.error(errorMessage);
            }
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'submission':
                return <Description className="w-5 h-5" />;
            case 'review':
                return <Assessment className="w-5 h-5" />;
            case 'conference':
                return <Event className="w-5 h-5" />;
            case 'decision':
                return <CheckCircle className="w-5 h-5" />;
            default:
                return <Description className="w-5 h-5" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'submission':
                return 'bg-blue-50 text-blue-600';
            case 'review':
                return 'bg-purple-50 text-purple-600';
            case 'conference':
                return 'bg-green-50 text-green-600';
            case 'decision':
                return 'bg-orange-50 text-orange-600';
            default:
                return 'bg-gray-50 text-gray-600';
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        const colors: { [key: string]: string } = {
            'Active': 'bg-green-100 text-green-800',
            'Under Review': 'bg-yellow-100 text-yellow-800',
            'Completed': 'bg-blue-100 text-blue-800',
            'Accept': 'bg-green-100 text-green-800',
            'Accepted': 'bg-green-100 text-green-800',
            'Reject': 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <CircularProgress size={40} />
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">Không thể tải thông tin người dùng</p>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="mt-4 px-4 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666]"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <Link
                        to="/admin/users"
                        className="inline-flex items-center text-[#008689] hover:text-[#006666] mb-4"
                    >
                        <ArrowBack className="w-5 h-5 mr-2" />
                        Quay lại danh sách
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#008689] to-[#006666] rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                    {user.name}
                                </h1>
                                <p className="text-gray-600 flex items-center">
                                    <Email className="w-4 h-4 mr-2" />
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                to={`/admin/users/${id}/edit`}
                                className="inline-flex items-center px-4 py-2 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                <Edit className="w-5 h-5 mr-2" />
                                Chỉnh sửa
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                <Delete className="w-5 h-5 mr-2" />
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - User Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">
                                Thông tin cơ bản
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">ID</p>
                                    <p className="text-sm font-medium text-gray-900">#{user.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Vai trò</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles.map((role) => (
                                            <span
                                                key={role}
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                                    role === 'CHAIR' ? 'bg-purple-100 text-purple-800' :
                                                        role === 'REVIEWER' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                                    <p className="text-sm font-medium text-gray-900 flex items-center">
                                        <CalendarMonth className="w-4 h-4 mr-2 text-gray-400" />
                                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Statistics Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">
                                Thống kê hoạt động
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Description className="w-5 h-5 text-blue-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Bài nộp</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">{user.totalSubmissions}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Assessment className="w-5 h-5 text-purple-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Đánh giá</span>
                                    </div>
                                    <span className="text-lg font-bold text-purple-600">{user.totalReviews}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Event className="w-5 h-5 text-green-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Hội nghị</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">{user.totalConferences}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-orange-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Quyết định</span>
                                    </div>
                                    <span className="text-lg font-bold text-orange-600">{user.totalDecisions}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Activity History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {/* Tabs */}
                            <div className="border-b border-gray-200">
                                <nav className="flex px-6">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'overview'
                                            ? 'border-[#008689] text-[#008689]'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Tổng quan
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('submissions')}
                                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'submissions'
                                            ? 'border-[#008689] text-[#008689]'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Bài nộp ({user.totalSubmissions})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('reviews')}
                                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'reviews'
                                            ? 'border-[#008689] text-[#008689]'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Đánh giá ({user.totalReviews})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('conferences')}
                                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'conferences'
                                            ? 'border-[#008689] text-[#008689]'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Hội nghị ({user.totalConferences})
                                    </button>
                                </nav>
                            </div>

                            {/* Activity Timeline */}
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    Lịch sử hoạt động
                                </h3>
                                <div className="space-y-4">
                                    {activities
                                        .filter((activity) => {
                                            if (activeTab === 'overview') return true;
                                            if (activeTab === 'submissions') return activity.type === 'submission';
                                            if (activeTab === 'reviews') return activity.type === 'review';
                                            if (activeTab === 'conferences') return activity.type === 'conference' || activity.type === 'decision';
                                            return true;
                                        })
                                        .map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                <div className={`p-3 rounded-lg mr-4 ${getActivityColor(activity.type)}`}>
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900">
                                                                {activity.title}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {activity.description}
                                                            </p>
                                                        </div>
                                                        {getStatusBadge(activity.status)}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                                                        <CalendarMonth className="w-3 h-3 mr-1" />
                                                        {new Date(activity.date).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailPage;
