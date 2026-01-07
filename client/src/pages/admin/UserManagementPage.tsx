import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Add,
    Search,
    FilterList,
    Edit,
    Delete,
    Download,
    Visibility,
} from '@mui/icons-material';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Inactive';
    createdAt: string;
}

const UserManagementPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Mock data - replace with API call
    const users: User[] = [
        {
            id: 1,
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com',
            role: 'ADMIN',
            status: 'Active',
            createdAt: '2025-01-15',
        },
        {
            id: 2,
            name: 'Trần Thị B',
            email: 'tranthib@example.com',
            role: 'CHAIR',
            status: 'Active',
            createdAt: '2025-02-20',
        },
        {
            id: 3,
            name: 'Lê Văn C',
            email: 'levanc@example.com',
            role: 'REVIEWER',
            status: 'Active',
            createdAt: '2025-03-10',
        },
        {
            id: 4,
            name: 'Phạm Thị D',
            email: 'phamthid@example.com',
            role: 'AUTHOR',
            status: 'Active',
            createdAt: '2025-03-25',
        },
        {
            id: 5,
            name: 'Hoàng Văn E',
            email: 'hoangvane@example.com',
            role: 'AUTHOR',
            status: 'Inactive',
            createdAt: '2025-04-05',
        },
        {
            id: 6,
            name: 'Võ Thị F',
            email: 'vothif@example.com',
            role: 'REVIEWER',
            status: 'Active',
            createdAt: '2025-04-12',
        },
        {
            id: 7,
            name: 'Đặng Văn G',
            email: 'dangvang@example.com',
            role: 'CHAIR',
            status: 'Active',
            createdAt: '2025-05-01',
        },
        {
            id: 8,
            name: 'Bùi Thị H',
            email: 'buithih@example.com',
            role: 'AUTHOR',
            status: 'Active',
            createdAt: '2025-05-18',
        },
    ];

    // Filter users based on search and filters
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-800';
            case 'CHAIR':
                return 'bg-purple-100 text-purple-800';
            case 'REVIEWER':
                return 'bg-blue-100 text-blue-800';
            case 'AUTHOR':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        return status === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800';
    };

    const handleDeleteUser = (userId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            // TODO: Call API to delete user
            console.log('Delete user:', userId);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Quản lý người dùng
                            </h1>
                            <p className="text-gray-600">
                                Quản lý tất cả người dùng trong hệ thống
                            </p>
                        </div>
                        <Link
                            to="/admin/users/create"
                            className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            <Add className="w-5 h-5 mr-2" />
                            Tạo người dùng mới
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-600 mb-1">Tổng người dùng</p>
                        <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-600 mb-1">Đang hoạt động</p>
                        <p className="text-3xl font-bold text-green-600">
                            {users.filter((u) => u.status === 'Active').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-600 mb-1">Không hoạt động</p>
                        <p className="text-3xl font-bold text-gray-600">
                            {users.filter((u) => u.status === 'Inactive').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-600 mb-1">Admin</p>
                        <p className="text-3xl font-bold text-red-600">
                            {users.filter((u) => u.role === 'ADMIN').length}
                        </p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hoặc email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vai trò
                            </label>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="ADMIN">Admin</option>
                                <option value="CHAIR">Chair</option>
                                <option value="REVIEWER">Reviewer</option>
                                <option value="AUTHOR">Author</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="Active">Đang hoạt động</option>
                                <option value="Inactive">Không hoạt động</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                        <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200">
                            <Download className="w-4 h-4 mr-2" />
                            Xuất CSV
                        </button>
                        <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200">
                            <FilterList className="w-4 h-4 mr-2" />
                            Bộ lọc nâng cao
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vai trò
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <p className="text-gray-500">Không tìm thấy người dùng nào</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                #{user.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                                                        user.role
                                                    )}`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                                                        user.status
                                                    )}`}
                                                >
                                                    {user.status === 'Active'
                                                        ? 'Hoạt động'
                                                        : 'Không hoạt động'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/admin/users/${user.id}`}
                                                        className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Visibility className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/users/${user.id}/edit`}
                                                        className="text-[#008689] hover:text-[#006666] p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                                                        title="Xóa"
                                                    >
                                                        <Delete className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Hiển thị <span className="font-medium">{filteredUsers.length}</span> /{' '}
                                <span className="font-medium">{users.length}</span> người dùng
                            </p>
                            <div className="flex items-center gap-2">
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                                    Trước
                                </button>
                                <button className="px-4 py-2 bg-[#008689] text-white rounded-lg text-sm font-medium">
                                    1
                                </button>
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                                    2
                                </button>
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                                    3
                                </button>
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;
