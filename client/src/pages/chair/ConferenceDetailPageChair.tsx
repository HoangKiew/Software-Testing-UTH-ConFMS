import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetConferenceByIdQuery } from '../../redux/api/conferencesApi';
import {
    CalendarMonth,
    LocationOn,
    Description,
    People,
    CheckCircle,
    Schedule,
    Edit,
    Email,
    Download,
    Add,
    Visibility,
    TrendingUp,
    Assignment,
    Gavel
} from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

interface Paper {
    id: number;
    paperId: string;
    title: string;
    authors: string[];
    track: string;
    submittedDate: string;
    status: 'Under Review' | 'Reviewed' | 'Decision Made';
    reviewsCompleted: number;
    reviewsTotal: number;
    decision?: 'Accept' | 'Minor Revision' | 'Major Revision' | 'Reject';
}

interface PCMember {
    id: number;
    name: string;
    email: string;
    affiliation: string;
    expertise: string[];
    assignedPapers: number;
    completedReviews: number;
}

const ConferenceDetailPageChair = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState<'overview' | 'papers' | 'pc-members'>('overview');
    const { data: apiConference, isLoading } = useGetConferenceByIdQuery(id || '', {
        skip: !id,
    });

    // Map API data to display format
    const conference = apiConference ? {
        id: apiConference.id,
        name: apiConference.name,
        acronym: apiConference.acronym,
        description: apiConference.description || 'Không có mô tả',
        startDate: apiConference.startDate,
        endDate: apiConference.endDate,
        location: apiConference.location || 'N/A',
        venue: 'N/A',
        website: 'N/A',
        status: apiConference.status === 'draft' ? 'Draft' : apiConference.status === 'active' ? 'Active' : 'Closed',
        submissionDeadline: apiConference.deadlines?.submission || 'N/A',
        reviewDeadline: apiConference.deadlines?.review || 'N/A',
        notificationDate: 'N/A',
        cameraReadyDeadline: apiConference.deadlines?.cameraReady || 'N/A',
        tracks: apiConference.topics || [],
        totalSubmissions: 0,
        underReview: 0,
        reviewed: 0,
        decisionsMade: 0,
        accepted: 0,
        rejected: 0,
        revisions: 0,
        totalPCMembers: 0,
        totalReviews: 0,
        completedReviews: 0,
        pendingReviews: 0
    } : null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-gray-600">Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!conference) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-red-600">Không tìm thấy hội nghị</p>
            </div>
        );
    }

    const papers: Paper[] = [
        {
            id: 1,
            paperId: 'P001',
            title: 'Deep Learning Approaches for Image Recognition in Medical Diagnosis',
            authors: ['Nguyen Van A', 'Tran Thi B'],
            track: 'Artificial Intelligence',
            submittedDate: '2026-03-15',
            status: 'Decision Made',
            reviewsCompleted: 3,
            reviewsTotal: 3,
            decision: 'Accept'
        },
        {
            id: 2,
            paperId: 'P002',
            title: 'Blockchain Technology for Secure Data Management in Healthcare',
            authors: ['Le Van C', 'Pham Thi D'],
            track: 'Cybersecurity',
            submittedDate: '2026-03-16',
            status: 'Reviewed',
            reviewsCompleted: 3,
            reviewsTotal: 3
        },
        {
            id: 3,
            paperId: 'P003',
            title: 'Machine Learning for Predictive Maintenance in IoT Systems',
            authors: ['Hoang Van E'],
            track: 'Data Science',
            submittedDate: '2026-03-17',
            status: 'Under Review',
            reviewsCompleted: 2,
            reviewsTotal: 3
        }
    ];

    const pcMembers: PCMember[] = [
        {
            id: 1,
            name: 'Dr. Nguyen Minh Hoang',
            email: 'hoang.nguyen@university.edu',
            affiliation: 'VNU-HCM',
            expertise: ['AI', 'Machine Learning', 'Computer Vision'],
            assignedPapers: 8,
            completedReviews: 8
        },
        {
            id: 2,
            name: 'Prof. Tran Thanh Tung',
            email: 'tung.tran@university.edu',
            affiliation: 'HCMUT',
            expertise: ['Software Engineering', 'Cloud Computing'],
            assignedPapers: 10,
            completedReviews: 7
        },
        {
            id: 3,
            name: 'Dr. Le Thi Mai',
            email: 'mai.le@university.edu',
            affiliation: 'UIT',
            expertise: ['Data Science', 'Big Data', 'Analytics'],
            assignedPapers: 9,
            completedReviews: 9
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Under Review': return 'text-blue-600 bg-blue-50';
            case 'Reviewed': return 'text-green-600 bg-green-50';
            case 'Decision Made': return 'text-purple-600 bg-purple-50';
            case 'Accept': return 'text-green-600 bg-green-50';
            case 'Minor Revision': return 'text-blue-600 bg-blue-50';
            case 'Major Revision': return 'text-orange-600 bg-orange-50';
            case 'Reject': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getDaysUntil = (date: string) => {
        const today = new Date();
        const targetDate = new Date(date);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const reviewProgress = Math.round((conference.completedReviews / conference.totalReviews) * 100);

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
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {conference.acronym}
                                </h1>
                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                                    {conference.status}
                                </span>
                            </div>
                            <h2 className="text-xl text-gray-700 mb-3">
                                {conference.name}
                            </h2>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <CalendarMonth className="w-4 h-4 mr-1" />
                                    {new Date(conference.startDate).toLocaleDateString('vi-VN')} - {new Date(conference.endDate).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="flex items-center">
                                    <LocationOn className="w-4 h-4 mr-1" />
                                    {conference.location}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to={`/chair/conferences/${conference.id}/edit`}
                                className="inline-flex items-center px-4 py-2 border border-[#008689] text-[#008689] font-medium rounded-lg hover:bg-[#008689] hover:text-white transition-colors"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Chỉnh sửa
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Description className="w-8 h-8 text-[#008689]" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{conference.totalSubmissions}</p>
                        <p className="text-sm text-gray-600">Bài nộp</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">{conference.completedReviews}</p>
                        <p className="text-sm text-gray-600">Reviews hoàn thành</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <People className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{conference.totalPCMembers}</p>
                        <p className="text-sm text-gray-600">PC Members</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Gavel className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-purple-600">{conference.decisionsMade}</p>
                        <p className="text-sm text-gray-600">Quyết định</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Link
                            to="/chair/assignments"
                            className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all"
                        >
                            <Assignment className="w-5 h-5 text-[#008689] mr-2" />
                            <span className="font-medium text-gray-900">Phân công bài</span>
                        </Link>
                        <Link
                            to="/chair/decisions"
                            className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all"
                        >
                            <Gavel className="w-5 h-5 text-[#008689] mr-2" />
                            <span className="font-medium text-gray-900">Đưa ra quyết định</span>
                        </Link>
                        <Link
                            to="/chair/progress"
                            className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all"
                        >
                            <TrendingUp className="w-5 h-5 text-[#008689] mr-2" />
                            <span className="font-medium text-gray-900">Theo dõi tiến độ</span>
                        </Link>
                        <Link
                            to={`/chair/conferences/${conference.id}/pc-members`}
                            className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-[#008689] hover:bg-[#e6f7f7] transition-all"
                        >
                            <People className="w-5 h-5 text-[#008689] mr-2" />
                            <span className="font-medium text-gray-900">Quản lý PC</span>
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'overview'
                                    ? 'border-[#008689] text-[#008689]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Tổng quan
                            </button>
                            <button
                                onClick={() => setActiveTab('papers')}
                                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'papers'
                                    ? 'border-[#008689] text-[#008689]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Bài báo ({papers.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pc-members')}
                                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'pc-members'
                                    ? 'border-[#008689] text-[#008689]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                PC Members ({pcMembers.length})
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Mô tả</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {conference.description}
                                    </p>
                                </div>

                                {/* Timeline */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline quan trọng</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <CalendarMonth className="w-5 h-5 text-gray-600 mr-3" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Hạn nộp bài</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(conference.submissionDeadline).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium ${getDaysUntil(conference.submissionDeadline) < 7 ? 'text-red-600' : 'text-gray-600'}`}>
                                                {getDaysUntil(conference.submissionDeadline)} ngày
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <Schedule className="w-5 h-5 text-gray-600 mr-3" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Hạn review</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(conference.reviewDeadline).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium ${getDaysUntil(conference.reviewDeadline) < 7 ? 'text-red-600' : 'text-gray-600'}`}>
                                                {getDaysUntil(conference.reviewDeadline)} ngày
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <Email className="w-5 h-5 text-gray-600 mr-3" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Ngày thông báo</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(conference.notificationDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">
                                                {getDaysUntil(conference.notificationDate)} ngày
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <Download className="w-5 h-5 text-gray-600 mr-3" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Hạn Camera-ready</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(conference.cameraReadyDeadline).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">
                                                {getDaysUntil(conference.cameraReadyDeadline)} ngày
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Progress */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Tiến độ Review</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">
                                                {conference.completedReviews} / {conference.totalReviews} reviews
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {reviewProgress}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-[#008689] h-3 rounded-full transition-all"
                                                style={{ width: `${reviewProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tracks */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Tracks</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {conference.tracks.map((track, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                                            >
                                                {track}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Decisions Summary */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Tóm tắt Quyết định</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-green-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-green-600">{conference.accepted}</p>
                                            <p className="text-sm text-gray-600">Chấp nhận</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-blue-600">{conference.revisions}</p>
                                            <p className="text-sm text-gray-600">Chỉnh sửa</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-red-600">{conference.rejected}</p>
                                            <p className="text-sm text-gray-600">Từ chối</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-orange-600">{conference.underReview}</p>
                                            <p className="text-sm text-gray-600">Đang review</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Papers Tab */}
                        {activeTab === 'papers' && (
                            <div className="space-y-4">
                                {papers.map((paper) => (
                                    <div
                                        key={paper.id}
                                        className="border border-gray-200 rounded-lg p-5 hover:border-[#008689] hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                        {paper.paperId}
                                                    </span>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                                        {paper.track}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(paper.status)}`}>
                                                        {paper.status}
                                                    </span>
                                                    {paper.decision && (
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(paper.decision)}`}>
                                                            {paper.decision}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-semibold text-gray-900 mb-2">
                                                    {paper.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    <strong>Tác giả:</strong> {paper.authors.join(', ')}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>Nộp: {new Date(paper.submittedDate).toLocaleDateString('vi-VN')}</span>
                                                    <span>Reviews: {paper.reviewsCompleted}/{paper.reviewsTotal}</span>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/submissions/${paper.id}`}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                            >
                                                <Visibility className="w-4 h-4 mr-1" />
                                                Xem
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PC Members Tab */}
                        {activeTab === 'pc-members' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Danh sách PC Members
                                    </h3>
                                    <Link
                                        to={`/chair/conferences/${conference.id}/pc-members`}
                                        className="inline-flex items-center px-4 py-2 bg-[#008689] text-white font-medium rounded-lg hover:bg-[#006666] transition-colors text-sm"
                                    >
                                        <Add className="w-4 h-4 mr-2" />
                                        Thêm PC Member
                                    </Link>
                                </div>

                                <div className="space-y-3">
                                    {pcMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-[#008689] transition-all"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 mb-1">
                                                        {member.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {member.affiliation} • {member.email}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {member.expertise.map((exp, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium"
                                                            >
                                                                {exp}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-4 text-sm text-gray-600">
                                                        <span>Được phân công: {member.assignedPapers}</span>
                                                        <span>Hoàn thành: {member.completedReviews}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConferenceDetailPageChair;
