import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Add,
    Search,
    FilterList,
    Visibility,
    Edit,
    Delete,
    CalendarMonth,
    Description,
    CheckCircle
} from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

const ConferenceManagementPage = () => {
    // Mock data
    const [conferences] = useState([
        {
            id: 1,
            shortName: 'ICCS 2026',
            fullName: 'International Conference on Computer Science 2026',
            startDate: '2026-06-15',
            endDate: '2026-06-17',
            location: 'TP. Hồ Chí Minh, Việt Nam',
            status: 'Active',
            statusColor: 'text-green-600 bg-green-50',
            submissions: 45,
            reviews: 32,
            decisions: 15,
        },
        {
            id: 2,
            shortName: 'VSEC 2026',
            fullName: 'Vietnam Software Engineering Conference 2026',
            startDate: '2026-05-20',
            endDate: '2026-05-22',
            location: 'Hà Nội, Việt Nam',
            status: 'Active',
            statusColor: 'text-green-600 bg-green-50',
            submissions: 32,
            reviews: 28,
            decisions: 10,
        },
        {
            id: 3,
            shortName: 'ISIT 2026',
            fullName: 'International Symposium on Information Technology 2026',
            startDate: '2026-07-10',
            endDate: '2026-07-12',
            location: 'Đà Nẵng, Việt Nam',
            status: 'Draft',
            statusColor: 'text-gray-600 bg-gray-50',
            submissions: 0,
            reviews: 0,
            decisions: 0,
        },
        {
            id: 4,
            shortName: 'UTHCONF 2026',
            fullName: 'Hội nghị Khoa học Công nghệ UTH 2026',
            startDate: '2026-04-01',
            endDate: '2026-04-03',
            location: 'TP. Hồ Chí Minh, Việt Nam',
            status: 'Closed',
            statusColor: 'text-red-600 bg-red-50',
            submissions: 67,
            reviews: 67,
            decisions: 67,
        },
    ]);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Filtered conferences
    const filteredConferences = conferences.filter(conf => {
        const matchesSearch = conf.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conf.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || conf.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const handleDelete = (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa hội nghị này?')) {
            console.log('Delete conference:', id);
            // TODO: Implement delete API call
        }
    };

    return (
        <div
            className="min-h-screen bg-gray-50 py-8 px-4"
            style={{
                backgroundImage: `url(${bgUth})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Quản lý Hội nghị
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Danh sách tất cả hội nghị của bạn
                            </p>
                        </div>
                        <Link
                            to="/chair/conferences/create"
                            className="flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                            <Add className="w-5 h-5 mr-2" />
                            Tạo hội nghị mới
                        </Link>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hội nghị..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <FilterList className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent appearance-none"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Tổng số hội nghị</p>
                        <p className="text-2xl font-bold text-gray-900">{conferences.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Đang hoạt động</p>
                        <p className="text-2xl font-bold text-green-600">
                            {conferences.filter(c => c.status === 'Active').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Bản nháp</p>
                        <p className="text-2xl font-bold text-gray-600">
                            {conferences.filter(c => c.status === 'Draft').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Đã đóng</p>
                        <p className="text-2xl font-bold text-red-600">
                            {conferences.filter(c => c.status === 'Closed').length}
                        </p>
                    </div>
                </div>

                {/* Conference List */}
                <div className="space-y-4">
                    {filteredConferences.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <p className="text-gray-500 text-lg">Không tìm thấy hội nghị nào</p>
                            <Link
                                to="/chair/conferences/create"
                                className="inline-flex items-center mt-4 text-[#008689] hover:text-[#006666] font-medium"
                            >
                                <Add className="w-5 h-5 mr-1" />
                                Tạo hội nghị mới
                            </Link>
                        </div>
                    ) : (
                        filteredConferences.map((conf) => (
                            <div
                                key={conf.id}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                {conf.shortName}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${conf.statusColor}`}>
                                                {conf.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2">{conf.fullName}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <CalendarMonth className="w-4 h-4 mr-1" />
                                                {new Date(conf.startDate).toLocaleDateString('vi-VN')} - {new Date(conf.endDate).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div>📍 {conf.location}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <Description className="w-5 h-5 text-[#008689] mr-1" />
                                            <p className="text-2xl font-bold text-[#008689]">{conf.submissions}</p>
                                        </div>
                                        <p className="text-xs text-gray-600">Bài nộp</p>
                                    </div>
                                    <div className="text-center border-l border-r border-gray-300">
                                        <div className="flex items-center justify-center mb-1">
                                            <CheckCircle className="w-5 h-5 text-blue-600 mr-1" />
                                            <p className="text-2xl font-bold text-blue-600">{conf.reviews}</p>
                                        </div>
                                        <p className="text-xs text-gray-600">Đánh giá</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <CheckCircle className="w-5 h-5 text-green-600 mr-1" />
                                            <p className="text-2xl font-bold text-green-600">{conf.decisions}</p>
                                        </div>
                                        <p className="text-xs text-gray-600">Quyết định</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Link
                                        to={`/chair/conferences/${conf.id}`}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        <Visibility className="w-4 h-4 mr-2" />
                                        Xem chi tiết
                                    </Link>
                                    <Link
                                        to={`/chair/conferences/${conf.id}/edit`}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-[#008689] text-[#008689] font-medium rounded-lg hover:bg-[#008689] hover:text-white transition-colors text-sm"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Chỉnh sửa
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(conf.id)}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors text-sm"
                                    >
                                        <Delete className="w-4 h-4 mr-2" />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConferenceManagementPage;
