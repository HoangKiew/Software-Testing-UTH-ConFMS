import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    FilterList,
    Edit,
    Delete,
    Visibility,
    Download,
    CalendarMonth,
    Person,
} from '@mui/icons-material';
import { useGetConferencesQuery, useDeleteConferenceMutation } from '../../redux/api/conferencesApi';
import { showToast } from '../../utils/toast.ts';
import CircularProgress from '@mui/material/CircularProgress';

interface Conference {
    id: number;
    name: string;
    acronym?: string;
    chair?: string;
    startDate: string;
    endDate: string;
    status?: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
    submissions?: number;
    reviews?: number;
    decisions?: number;
}

const AllConferencesPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Fetch conferences from API
    const { data: conferencesData, isLoading, error } = useGetConferencesQuery();
    const [deleteConference] = useDeleteConferenceMutation();

    // Map API data to component format
    const apiConferences = Array.isArray(conferencesData) ? conferencesData : (conferencesData?.data || []);
    
    const conferences: Conference[] = apiConferences.map((conf: any) => ({
        id: conf.id,
        name: conf.name || '',
        acronym: conf.acronym || conf.name?.substring(0, 10) || `CONF-${conf.id}`,
        chair: conf.chair || conf.chairName || 'N/A',
        startDate: conf.startDate || new Date().toISOString(),
        endDate: conf.endDate || new Date().toISOString(),
        status: conf.status || 'Draft',
        submissions: conf.submissions || conf._count?.submissions || 0,
        reviews: conf.reviews || conf._count?.reviews || 0,
        decisions: conf.decisions || conf._count?.decisions || 0,
    }));

    // Filter conferences
    const filteredConferences = conferences.filter((conf) => {
        const matchesSearch =
            conf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (conf.acronym || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (conf.chair || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || conf.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadgeColor = (status?: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Draft':
                return 'bg-gray-100 text-gray-800';
            case 'Completed':
                return 'bg-blue-100 text-blue-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'Active':
                return 'Đang hoạt động';
            case 'Draft':
                return 'Nháp';
            case 'Completed':
                return 'Đã hoàn thành';
            case 'Cancelled':
                return 'Đã hủy';
            default:
                return status || 'N/A';
        }
    };

    const handleDeleteConference = async (confId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa hội nghị này?')) {
            try {
                await deleteConference(confId).unwrap();
                showToast.success('Xóa hội nghị thành công!');
            } catch (err: any) {
                const errorMessage = err?.data?.message || 'Xóa hội nghị thất bại!';
                showToast.error(errorMessage);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Tất cả hội nghị
                    </h1>
                    <p className="text-gray-600">
                        Quản lý tất cả hội nghị trong hệ thống
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-600 mb-1">Tổng hội nghị</p>
                        <p className="text-3xl font-bold text-gray-900">{conferences.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-600 mb-1">Đang hoạt động</p>
                        <p className="text-3xl font-bold text-green-600">
                            {conferences.filter((c) => c.status === 'Active').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-600 mb-1">Nháp</p>
                        <p className="text-3xl font-bold text-gray-600">
                            {conferences.filter((c) => c.status === 'Draft').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-600 mb-1">Đã hoàn thành</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {conferences.filter((c) => c.status === 'Completed').length}
                        </p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên, mã hội nghị, hoặc chair..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>
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
                                <option value="Draft">Nháp</option>
                                <option value="Completed">Đã hoàn thành</option>
                                <option value="Cancelled">Đã hủy</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                        <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200">
                            <Download className="w-4 h-4 mr-2" />
                            Xuất báo cáo
                        </button>
                        <button className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200">
                            <FilterList className="w-4 h-4 mr-2" />
                            Bộ lọc nâng cao
                        </button>
                    </div>
                </div>

                {/* Conferences Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="px-6 py-12 text-center">
                                <CircularProgress size={40} />
                                <p className="mt-4 text-gray-600">Đang tải danh sách hội nghị...</p>
                            </div>
                        ) : error ? (
                            <div className="px-6 py-12 text-center">
                                <p className="text-red-600">Không thể tải danh sách hội nghị</p>
                            </div>
                        ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hội nghị
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chair
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
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
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredConferences.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center">
                                            <p className="text-gray-500">Không tìm thấy hội nghị nào</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredConferences.map((conf) => (
                                        <tr key={conf.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                #{conf.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {conf.acronym}
                                                </div>
                                                <div className="text-sm text-gray-600 max-w-xs truncate">
                                                    {conf.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Person className="w-4 h-4 mr-2 text-gray-400" />
                                                    {conf.chair}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <CalendarMonth className="w-4 h-4 mr-2 text-gray-400" />
                                                    <div>
                                                        <div>{new Date(conf.startDate).toLocaleDateString('vi-VN')}</div>
                                                        <div className="text-xs text-gray-500">
                                                            đến {new Date(conf.endDate).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                                                        conf.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(conf.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                {conf.submissions}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                {conf.reviews}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                {conf.decisions}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/chair/conferences/${conf.id}`}
                                                        className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Visibility className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        to={`/chair/conferences/${conf.id}/edit`}
                                                        className="text-[#008689] hover:text-[#006666] p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteConference(conf.id)}
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
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Hiển thị <span className="font-medium">{filteredConferences.length}</span> /{' '}
                                <span className="font-medium">{conferences.length}</span> hội nghị
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

export default AllConferencesPage;
