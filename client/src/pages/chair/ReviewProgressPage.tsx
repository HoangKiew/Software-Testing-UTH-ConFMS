import { useState } from 'react';
import {
    TrendingUp,
    CheckCircle,
    Schedule,
    Warning,
    Description,
    FilterList,
    Search,
    CalendarMonth
} from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

interface Conference {
    id: number;
    name: string;
    acronym: string;
    deadline: string;
    totalPapers: number;
    assignedReviews: number;
    completedReviews: number;
    pendingReviews: number;
    overdueReviews: number;
    status: 'On Track' | 'At Risk' | 'Delayed';
}

const ReviewProgressPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'on-track' | 'at-risk' | 'delayed'>('all');

    // Mock data
    const conferences: Conference[] = [
        {
            id: 1,
            name: 'International Conference on Computer Science 2026',
            acronym: 'ICCS 2026',
            deadline: '2026-04-15',
            totalPapers: 45,
            assignedReviews: 135,
            completedReviews: 98,
            pendingReviews: 37,
            overdueReviews: 5,
            status: 'At Risk'
        },
        {
            id: 2,
            name: 'Vietnam Software Engineering Conference 2026',
            acronym: 'VSEC 2026',
            deadline: '2026-04-20',
            totalPapers: 32,
            assignedReviews: 96,
            completedReviews: 85,
            pendingReviews: 11,
            overdueReviews: 0,
            status: 'On Track'
        },
        {
            id: 3,
            name: 'International Symposium on Information Technology 2026',
            acronym: 'ISIT 2026',
            deadline: '2026-03-30',
            totalPapers: 28,
            assignedReviews: 84,
            completedReviews: 45,
            pendingReviews: 39,
            overdueReviews: 12,
            status: 'Delayed'
        }
    ];

    // Calculate overall statistics
    const totalPapers = conferences.reduce((sum, conf) => sum + conf.totalPapers, 0);
    const totalCompletedReviews = conferences.reduce((sum, conf) => sum + conf.completedReviews, 0);
    const totalPendingReviews = conferences.reduce((sum, conf) => sum + conf.pendingReviews, 0);
    const totalOverdueReviews = conferences.reduce((sum, conf) => sum + conf.overdueReviews, 0);

    // Filter conferences
    const filteredConferences = conferences.filter(conf => {
        const matchesSearch = conf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conf.acronym.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        if (filterStatus === 'on-track') matchesFilter = conf.status === 'On Track';
        if (filterStatus === 'at-risk') matchesFilter = conf.status === 'At Risk';
        if (filterStatus === 'delayed') matchesFilter = conf.status === 'Delayed';

        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'On Track': return 'text-green-600 bg-green-50 border-green-200';
            case 'At Risk': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Delayed': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getDaysUntilDeadline = (deadline: string) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
                    <div className="flex items-center mb-2">
                        <TrendingUp className="w-8 h-8 text-[#008689] mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">
                            Theo dõi Tiến độ Review
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Giám sát tiến độ đánh giá bài báo và hiệu suất của reviewers
                    </p>
                </div>

                {/* Overall Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Description className="w-8 h-8 text-[#008689]" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{totalPapers}</p>
                        <p className="text-sm text-gray-600">Tổng số bài</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">{totalCompletedReviews}</p>
                        <p className="text-sm text-gray-600">Đã hoàn thành</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Schedule className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{totalPendingReviews}</p>
                        <p className="text-sm text-gray-600">Đang chờ</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Warning className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-2xl font-bold text-red-600">{totalOverdueReviews}</p>
                        <p className="text-sm text-gray-600">Quá hạn</p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm hội nghị..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            />
                        </div>
                        <div className="relative">
                            <FilterList className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent appearance-none"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="on-track">On Track</option>
                                <option value="at-risk">At Risk</option>
                                <option value="delayed">Delayed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Conference Progress */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Tiến độ theo Hội nghị ({filteredConferences.length})
                    </h2>

                    <div className="space-y-4">
                        {filteredConferences.map((conf) => {
                            const progress = Math.round((conf.completedReviews / conf.assignedReviews) * 100);
                            const daysLeft = getDaysUntilDeadline(conf.deadline);

                            return (
                                <div
                                    key={conf.id}
                                    className="border-2 rounded-lg p-5 hover:border-[#008689] transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {conf.acronym}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(conf.status)}`}>
                                                    {conf.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{conf.name}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <CalendarMonth className="w-4 h-4 mr-1" />
                                                    Deadline: {new Date(conf.deadline).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div className={`font-medium ${daysLeft < 7 ? 'text-red-600' : daysLeft < 14 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {daysLeft > 0 ? `${daysLeft} ngày còn lại` : `Quá hạn ${Math.abs(daysLeft)} ngày`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">
                                                Tiến độ đánh giá
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {conf.completedReviews}/{conf.assignedReviews} ({progress}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all ${getProgressColor(progress)}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-[#008689]">{conf.totalPapers}</p>
                                            <p className="text-xs text-gray-600">Bài báo</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-green-600">{conf.completedReviews}</p>
                                            <p className="text-xs text-gray-600">Hoàn thành</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-blue-600">{conf.pendingReviews}</p>
                                            <p className="text-xs text-gray-600">Đang chờ</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-red-600">{conf.overdueReviews}</p>
                                            <p className="text-xs text-gray-600">Quá hạn</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewProgressPage;
