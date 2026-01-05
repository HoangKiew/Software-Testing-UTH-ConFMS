import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CalendarMonth, Category, Description } from '@mui/icons-material';

interface Conference {
    id: number;
    name: string;
    shortName: string;
    deadline: string;
    topics: string[];
    status: 'Open' | 'Closing Soon' | 'Closed';
    description: string;
    submissionCount: number;
}

const ConferenceListPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [topicFilter, setTopicFilter] = useState<string>('all');

    // Mock data
    const conferences: Conference[] = [
        {
            id: 1,
            name: 'International Conference on Computer Science 2026',
            shortName: 'ICCS 2026',
            deadline: '2026-03-15',
            topics: ['Machine Learning', 'AI', 'Data Science'],
            status: 'Open',
            description: 'Leading conference in computer science research',
            submissionCount: 45
        },
        {
            id: 2,
            name: 'Vietnam Software Engineering Conference 2026',
            shortName: 'VSEC 2026',
            deadline: '2026-02-28',
            topics: ['Software Engineering', 'DevOps', 'Cloud Computing'],
            status: 'Closing Soon',
            description: 'Annual conference on software engineering practices',
            submissionCount: 32
        },
        {
            id: 3,
            name: 'International Symposium on Information Technology 2026',
            shortName: 'ISIT 2026',
            deadline: '2026-04-20',
            topics: ['Cybersecurity', 'IoT', 'Blockchain'],
            status: 'Open',
            description: 'Symposium focusing on emerging IT technologies',
            submissionCount: 28
        },
        {
            id: 4,
            name: 'Asia-Pacific Conference on Data Mining 2026',
            shortName: 'APCDM 2026',
            deadline: '2026-01-31',
            topics: ['Data Mining', 'Big Data', 'Analytics'],
            status: 'Closing Soon',
            description: 'Premier conference on data mining in Asia-Pacific',
            submissionCount: 56
        },
        {
            id: 5,
            name: 'International Workshop on Mobile Computing 2025',
            shortName: 'IWMC 2025',
            deadline: '2025-12-15',
            topics: ['Mobile Computing', '5G', 'Edge Computing'],
            status: 'Closed',
            description: 'Workshop on mobile and wireless technologies',
            submissionCount: 67
        },
        {
            id: 6,
            name: 'Conference on Human-Computer Interaction 2026',
            shortName: 'CHI 2026',
            deadline: '2026-05-10',
            topics: ['HCI', 'UX Design', 'Accessibility'],
            status: 'Open',
            description: 'International conference on HCI research',
            submissionCount: 41
        }
    ];

    // Get unique topics for filter
    const allTopics = Array.from(new Set(conferences.flatMap(c => c.topics)));

    // Filter conferences
    const filteredConferences = conferences.filter(conference => {
        const matchesSearch = conference.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conference.shortName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || conference.status === statusFilter;
        const matchesTopic = topicFilter === 'all' || conference.topics.includes(topicFilter);
        return matchesSearch && matchesStatus && matchesTopic;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open':
                return 'bg-green-100 text-green-800';
            case 'Closing Soon':
                return 'bg-yellow-100 text-yellow-800';
            case 'Closed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDaysUntilDeadline = (deadline: string) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Danh sách Hội nghị
                    </h1>
                    <p className="text-gray-600">
                        Tìm kiếm và nộp bài cho các hội nghị khoa học đang mở
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="md:col-span-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm hội nghị theo tên..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="Open">Đang mở</option>
                                <option value="Closing Soon">Sắp đóng</option>
                                <option value="Closed">Đã đóng</option>
                            </select>
                        </div>

                        {/* Topic Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chủ đề
                            </label>
                            <select
                                value={topicFilter}
                                onChange={(e) => setTopicFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            >
                                <option value="all">Tất cả chủ đề</option>
                                {allTopics.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                        </div>

                        {/* Results Count */}
                        <div className="flex items-end">
                            <p className="text-sm text-gray-600">
                                Tìm thấy <span className="font-semibold text-[#008689]">{filteredConferences.length}</span> hội nghị
                            </p>
                        </div>
                    </div>
                </div>

                {/* Conference Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredConferences.map(conference => {
                        const daysLeft = getDaysUntilDeadline(conference.deadline);
                        return (
                            <div
                                key={conference.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {conference.shortName}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {conference.name}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(conference.status)}`}>
                                            {conference.status === 'Open' ? 'Đang mở' :
                                                conference.status === 'Closing Soon' ? 'Sắp đóng' : 'Đã đóng'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4">
                                        {conference.description}
                                    </p>

                                    {/* Deadline */}
                                    <div className="flex items-center text-sm text-gray-700 mb-3">
                                        <CalendarMonth className="w-4 h-4 mr-2 text-[#008689]" />
                                        <span className="font-medium">Deadline:</span>
                                        <span className="ml-2">{new Date(conference.deadline).toLocaleDateString('vi-VN')}</span>
                                        {daysLeft > 0 && conference.status !== 'Closed' && (
                                            <span className="ml-2 text-xs text-gray-500">
                                                (còn {daysLeft} ngày)
                                            </span>
                                        )}
                                    </div>

                                    {/* Topics */}
                                    <div className="mb-4">
                                        <div className="flex items-start text-sm text-gray-700 mb-2">
                                            <Category className="w-4 h-4 mr-2 text-[#008689] mt-0.5" />
                                            <span className="font-medium">Topics:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 ml-6">
                                            {conference.topics.slice(0, 3).map(topic => (
                                                <span
                                                    key={topic}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                            {conference.topics.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                                    +{conference.topics.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submission Count */}
                                    <div className="flex items-center text-sm text-gray-600 mb-4">
                                        <Description className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{conference.submissionCount} bài đã nộp</span>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/conferences/${conference.id}`}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm"
                                        >
                                            Chi tiết
                                        </Link>
                                        {conference.status !== 'Closed' && (
                                            <Link
                                                to="/submission"
                                                className="flex-1 px-4 py-2 bg-[#008689] hover:bg-[#006666] text-white text-center font-medium rounded-lg transition-colors duration-200 text-sm"
                                            >
                                                Nộp bài
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredConferences.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <Search className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Không tìm thấy hội nghị
                        </h3>
                        <p className="text-gray-600">
                            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConferenceListPage;
