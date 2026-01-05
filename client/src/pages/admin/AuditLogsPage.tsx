import { useState } from 'react';
import {
    Search,
} from '@mui/icons-material';

interface AuditLog {
    id: number;
    user: string;
    role: string;
    action: string;
    resource: string;
    resourceId: string;
    details: string;
    ipAddress: string;
    timestamp: string;
    status: 'Success' | 'Failed';
}

const AuditLogsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    // Mock data
    const logs: AuditLog[] = [
        {
            id: 1,
            user: 'Nguyễn Văn A',
            role: 'CHAIR',
            action: 'CREATE',
            resource: 'Conference',
            resourceId: 'CONF-2026-001',
            details: 'Created new conference: International Conference on Computer Science 2026',
            ipAddress: '192.168.1.10',
            timestamp: '2026-01-05 10:30:00',
            status: 'Success',
        },
        {
            id: 2,
            user: 'Trần Thị B',
            role: 'AUTHOR',
            action: 'SUBMIT',
            resource: 'Paper',
            resourceId: 'PAPER-123',
            details: 'Submitted paper: Deep Learning in Healthcare',
            ipAddress: '192.168.1.15',
            timestamp: '2026-01-05 10:15:00',
            status: 'Success',
        },
        {
            id: 3,
            user: 'Lê Văn C',
            role: 'REVIEWER',
            action: 'REVIEW',
            resource: 'Paper',
            resourceId: 'PAPER-123',
            details: 'Submitted review for paper #123',
            ipAddress: '192.168.1.20',
            timestamp: '2026-01-05 09:45:00',
            status: 'Success',
        },
        {
            id: 4,
            user: 'System Admin',
            role: 'ADMIN',
            action: 'LOGIN',
            resource: 'System',
            resourceId: 'N/A',
            details: 'Admin login detected',
            ipAddress: '192.168.1.1',
            timestamp: '2026-01-05 09:00:00',
            status: 'Success',
        },
        {
            id: 5,
            user: 'Phạm Thị D',
            role: 'AUTHOR',
            action: 'LOGIN_FAILED',
            resource: 'System',
            resourceId: 'N/A',
            details: 'Invalid password attempt',
            ipAddress: '192.168.1.30',
            timestamp: '2026-01-05 08:30:00',
            status: 'Failed',
        },
        {
            id: 6,
            user: 'Hoàng Văn E',
            role: 'CHAIR',
            action: 'UPDATE',
            resource: 'Conference',
            resourceId: 'CONF-2026-002',
            details: 'Updated conference settings',
            ipAddress: '192.168.1.25',
            timestamp: '2026-01-04 16:20:00',
            status: 'Success',
        },
    ];

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAction = filterAction === 'all' || log.action === filterAction;
        const matchesDate = !filterDate || log.timestamp.includes(filterDate);
        return matchesSearch && matchesAction && matchesDate;
    });

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'text-green-600 bg-green-50';
        if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
        if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
        if (action.includes('LOGIN_FAILED')) return 'text-red-600 bg-red-50';
        if (action.includes('LOGIN')) return 'text-purple-600 bg-purple-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Nhật ký hoạt động
                    </h1>
                    <p className="text-gray-600">
                        Theo dõi và kiểm tra các hoạt động trong hệ thống
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Tổng hoạt động</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{logs.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Hoạt động hôm nay</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                            {logs.filter(l => l.timestamp.includes('2026-01-05')).length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Lỗi / Thất bại</p>
                        <p className="text-2xl font-bold text-red-600 mt-2">
                            {logs.filter(l => l.status === 'Failed').length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Users hoạt động</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                            {new Set(logs.map(l => l.user)).size}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo user, resource..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loại hoạt động
                            </label>
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="LOGIN">Đăng nhập</option>
                                <option value="CREATE">Tạo mới</option>
                                <option value="UPDATE">Cập nhật</option>
                                <option value="DELETE">Xóa</option>
                                <option value="SUBMIT">Nộp bài</option>
                                <option value="REVIEW">Đánh giá</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày
                            </label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian / IP
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hành động
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chi tiết
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            Không tìm thấy nhật ký nào
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono mt-1">
                                                    {log.ipAddress}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                                                        {log.user.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.user}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {log.role}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {log.resource}
                                                    {log.resourceId !== 'N/A' && ` #${log.resourceId}`}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {log.details}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {log.status === 'Success' ? (
                                                        <span className="w-2 h-2 mr-1.5 bg-green-400 rounded-full" />
                                                    ) : (
                                                        <span className="w-2 h-2 mr-1.5 bg-red-400 rounded-full" />
                                                    )}
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                            Hiển thị {filteredLogs.length} / {logs.length} bản ghi
                        </span>
                        <button className="text-sm text-[#008689] hover:text-[#006666] font-medium">
                            Xem thêm logs cũ hơn →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
