import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Visibility,
    Edit,
    Delete,
    CloudUpload,
    Description,
    CalendarMonth
} from '@mui/icons-material';

type SubmissionStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

interface Submission {
    id: number;
    title: string;
    conference: string;
    conferenceId: number;
    submittedDate: string;
    deadline: string;
    status: SubmissionStatus;
    authors: string[];
    abstract: string;
}

const MySubmissionsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Mock data
    const submissions: Submission[] = [
        {
            id: 1,
            title: 'Deep Learning Approaches for Image Classification',
            conference: 'ICCS 2026',
            conferenceId: 1,
            submittedDate: '2025-12-15',
            deadline: '2026-03-15',
            status: 'Under Review',
            authors: ['Nguyễn Văn A', 'Trần Thị B'],
            abstract: 'This paper presents a novel approach to image classification using deep learning...'
        },
        {
            id: 2,
            title: 'Microservices Architecture for Scalable Applications',
            conference: 'VSEC 2026',
            conferenceId: 2,
            submittedDate: '2025-12-20',
            deadline: '2026-02-28',
            status: 'Submitted',
            authors: ['Nguyễn Văn A', 'Lê Văn C'],
            abstract: 'We propose a microservices-based architecture for building scalable web applications...'
        },
        {
            id: 3,
            title: 'Machine Learning for Traffic Prediction',
            conference: 'ICCS 2026',
            conferenceId: 1,
            submittedDate: '2025-11-10',
            deadline: '2026-03-15',
            status: 'Accepted',
            authors: ['Nguyễn Văn A'],
            abstract: 'This research applies machine learning techniques to predict traffic patterns...'
        },
        {
            id: 4,
            title: 'Blockchain Technology in Supply Chain Management',
            conference: 'ISIT 2026',
            conferenceId: 3,
            submittedDate: '2025-10-05',
            deadline: '2026-04-20',
            status: 'Rejected',
            authors: ['Nguyễn Văn A', 'Phạm Thị D'],
            abstract: 'We explore the application of blockchain technology in supply chain systems...'
        },
        {
            id: 5,
            title: 'Natural Language Processing for Vietnamese Text',
            conference: 'ICCS 2026',
            conferenceId: 1,
            submittedDate: '2025-12-01',
            deadline: '2026-03-15',
            status: 'Under Review',
            authors: ['Nguyễn Văn A', 'Hoàng Văn E'],
            abstract: 'This paper introduces a new NLP model specifically designed for Vietnamese language...'
        }
    ];

    // Filter submissions
    const filteredSubmissions = submissions.filter(submission => {
        const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.conference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: SubmissionStatus) => {
        switch (status) {
            case 'Submitted':
                return 'bg-blue-100 text-blue-800';
            case 'Under Review':
                return 'bg-yellow-100 text-yellow-800';
            case 'Accepted':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const canEdit = (submission: Submission) => {
        const today = new Date();
        const deadline = new Date(submission.deadline);
        return today < deadline && (submission.status === 'Submitted' || submission.status === 'Under Review');
    };

    const handleWithdraw = (id: number) => {
        if (confirm('Bạn có chắc chắn muốn rút bài này không?')) {
            console.log('Withdraw submission:', id);
            // TODO: Implement withdraw logic
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Bài nộp của tôi
                    </h1>
                    <p className="text-gray-600">
                        Quản lý và theo dõi trạng thái các bài báo đã nộp
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tiêu đề hoặc hội nghị..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="Submitted">Đã nộp</option>
                                <option value="Under Review">Đang đánh giá</option>
                                <option value="Accepted">Chấp nhận</option>
                                <option value="Rejected">Từ chối</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm text-gray-600">
                            Tìm thấy <span className="font-semibold text-[#008689]">{filteredSubmissions.length}</span> bài nộp
                        </p>
                    </div>
                </div>

                {/* Submissions List */}
                <div className="space-y-4">
                    {filteredSubmissions.map(submission => (
                        <div
                            key={submission.id}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 flex-1">
                                            {submission.title}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>
                                            {submission.status === 'Submitted' ? 'Đã nộp' :
                                                submission.status === 'Under Review' ? 'Đang đánh giá' :
                                                    submission.status === 'Accepted' ? 'Chấp nhận' : 'Từ chối'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-3">
                                        <span className="font-medium">Hội nghị:</span> {submission.conference}
                                    </p>

                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {submission.abstract}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center">
                                            <Description className="w-4 h-4 mr-1 text-gray-400" />
                                            <span>Tác giả: {submission.authors.join(', ')}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <CalendarMonth className="w-4 h-4 mr-1 text-gray-400" />
                                            <span>Nộp: {new Date(submission.submittedDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <CalendarMonth className="w-4 h-4 mr-1 text-gray-400" />
                                            <span>Deadline: {new Date(submission.deadline).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    to={`/submissions/${submission.id}`}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                                >
                                    <Visibility className="w-4 h-4 mr-2" />
                                    Xem chi tiết
                                </Link>

                                {canEdit(submission) && (
                                    <Link
                                        to={`/submissions/${submission.id}/edit`}
                                        className="inline-flex items-center px-4 py-2 border border-[#008689] text-[#008689] font-medium rounded-lg hover:bg-[#008689] hover:text-white transition-colors duration-200 text-sm"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Chỉnh sửa
                                    </Link>
                                )}

                                {submission.status === 'Accepted' && (
                                    <Link
                                        to={`/submissions/${submission.id}/camera-ready`}
                                        className="inline-flex items-center px-4 py-2 bg-[#008689] text-white font-medium rounded-lg hover:bg-[#006666] transition-colors duration-200 text-sm"
                                    >
                                        <CloudUpload className="w-4 h-4 mr-2" />
                                        Upload Camera-ready
                                    </Link>
                                )}

                                {(submission.status === 'Submitted' || submission.status === 'Under Review') && (
                                    <button
                                        onClick={() => handleWithdraw(submission.id)}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200 text-sm"
                                    >
                                        <Delete className="w-4 h-4 mr-2" />
                                        Rút bài
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredSubmissions.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <Description className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Không tìm thấy bài nộp
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                : 'Bạn chưa nộp bài báo nào'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <Link
                                to="/conferences"
                                className="inline-block px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                Tìm hội nghị để nộp bài
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MySubmissionsPage;
