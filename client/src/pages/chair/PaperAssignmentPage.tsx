import { useState } from 'react';
import {
    Search,
    Person,
    Assignment,
    Warning,
    CheckCircle,
    AutoAwesome,
    FilterList
} from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

interface Paper {
    id: number;
    paperId: string;
    title: string;
    authors: string[];
    track: string;
    keywords: string[];
    submittedDate: string;
    assignedReviewers: number;
    requiredReviewers: number;
    reviewerNames?: string[];
}

interface Reviewer {
    id: number;
    name: string;
    email: string;
    expertise: string[];
    assignedPapers: number;
    maxPapers: number;
    conflicts: number[]; // Paper IDs with COI
}

const PaperAssignmentPage = () => {
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'unassigned' | 'partial' | 'complete'>('all');

    // Mock data
    const papers: Paper[] = [
        {
            id: 1,
            paperId: 'P001',
            title: 'Deep Learning Approaches for Image Recognition in Medical Diagnosis',
            authors: ['Nguyen Van A', 'Tran Thi B'],
            track: 'Artificial Intelligence',
            keywords: ['Deep Learning', 'Image Recognition', 'Medical AI'],
            submittedDate: '2026-03-15',
            assignedReviewers: 1,
            requiredReviewers: 3,
            reviewerNames: ['Dr. Nguyen Minh Hoang'],
        },
        {
            id: 2,
            paperId: 'P002',
            title: 'Blockchain Technology for Secure Data Management',
            authors: ['Le Van C', 'Pham Thi D'],
            track: 'Cybersecurity',
            keywords: ['Blockchain', 'Security', 'Data Management'],
            submittedDate: '2026-03-16',
            assignedReviewers: 0,
            requiredReviewers: 3,
        },
        {
            id: 3,
            paperId: 'P003',
            title: 'Machine Learning for Predictive Maintenance in IoT Systems',
            authors: ['Hoang Van E'],
            track: 'Internet of Things',
            keywords: ['Machine Learning', 'IoT', 'Predictive Maintenance'],
            submittedDate: '2026-03-17',
            assignedReviewers: 3,
            requiredReviewers: 3,
            reviewerNames: ['Dr. Le Thi Mai', 'Prof. Tran Thanh Tung', 'Assoc. Prof. Pham Van Duc'],
        },
    ];

    const reviewers: Reviewer[] = [
        {
            id: 1,
            name: 'Dr. Nguyen Minh Hoang',
            email: 'hoang.nm@uth.edu.vn',
            expertise: ['Deep Learning', 'Computer Vision', 'Medical AI'],
            assignedPapers: 3,
            maxPapers: 8,
            conflicts: [1], // COI with paper 1
        },
        {
            id: 2,
            name: 'Prof. Tran Thanh Tung',
            email: 'tung.tt@uth.edu.vn',
            expertise: ['Blockchain', 'Cryptography', 'Security'],
            assignedPapers: 2,
            maxPapers: 6,
            conflicts: [],
        },
        {
            id: 3,
            name: 'Dr. Le Thi Mai',
            email: 'mai.lt@uth.edu.vn',
            expertise: ['Machine Learning', 'IoT', 'Data Science'],
            assignedPapers: 4,
            maxPapers: 8,
            conflicts: [3], // COI with paper 3
        },
        {
            id: 4,
            name: 'Assoc. Prof. Pham Van Duc',
            email: 'duc.pv@uth.edu.vn',
            expertise: ['AI', 'Natural Language Processing', 'Deep Learning'],
            assignedPapers: 1,
            maxPapers: 5,
            conflicts: [],
        },
    ];

    // Filter papers
    const filteredPapers = papers.filter(paper => {
        const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            paper.paperId.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        if (filterStatus === 'unassigned') matchesFilter = paper.assignedReviewers === 0;
        if (filterStatus === 'partial') matchesFilter = paper.assignedReviewers > 0 && paper.assignedReviewers < paper.requiredReviewers;
        if (filterStatus === 'complete') matchesFilter = paper.assignedReviewers >= paper.requiredReviewers;

        return matchesSearch && matchesFilter;
    });

    // Calculate match score
    const getMatchScore = (paper: Paper, reviewer: Reviewer): number => {
        const matches = paper.keywords.filter(k =>
            reviewer.expertise.some(e => e.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(e.toLowerCase()))
        );
        return (matches.length / paper.keywords.length) * 100;
    };

    // Handle assignment
    const handleAssign = (paperId: number, reviewerId: number) => {
        const reviewer = reviewers.find(r => r.id === reviewerId);
        const paper = papers.find(p => p.id === paperId);

        if (reviewer && paper) {
            // Check COI
            if (reviewer.conflicts.includes(paperId)) {
                alert('⚠️ CẢNH BÁO: Phát hiện xung đột lợi ích (COI)!\n\nReviewer này có xung đột lợi ích với bài báo này và không thể được phân công.');
                return;
            }

            // Check max papers
            if (reviewer.assignedPapers >= reviewer.maxPapers) {
                alert('⚠️ Reviewer này đã đạt giới hạn số bài tối đa!');
                return;
            }

            console.log(`Assign paper ${paperId} to reviewer ${reviewerId}`);
            alert(`✅ Đã phân công bài "${paper.title}" cho ${reviewer.name}`);
            // TODO: Implement API call
        }
    };

    // Auto-assign
    const handleAutoAssign = () => {
        alert('🤖 Đang tự động phân công dựa trên:\n• Chuyên môn của reviewer\n• Từ khóa của bài báo\n• Số lượng bài đã nhận\n• Phát hiện và tránh COI\n\n✅ Đã phân công thành công!');
        // TODO: Implement auto-assignment algorithm
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
                                Phân Công Bài Báo
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Phân công bài báo cho reviewers (PC members)
                            </p>
                        </div>
                        <button
                            onClick={handleAutoAssign}
                            className="flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                            <AutoAwesome className="w-5 h-5 mr-2" />
                            Tự động phân công
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Tổng số bài</p>
                        <p className="text-2xl font-bold text-gray-900">{papers.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Chưa phân công</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {papers.filter(p => p.assignedReviewers === 0).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Đang phân công</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {papers.filter(p => p.assignedReviewers > 0 && p.assignedReviewers < p.requiredReviewers).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Đã đủ reviewer</p>
                        <p className="text-2xl font-bold text-green-600">
                            {papers.filter(p => p.assignedReviewers >= p.requiredReviewers).length}
                        </p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên bài hoặc ID..."
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
                                <option value="unassigned">Chưa phân công</option>
                                <option value="partial">Đang phân công</option>
                                <option value="complete">Đã đủ reviewer</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Papers List */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Danh sách Bài báo ({filteredPapers.length})
                        </h2>

                        <div className="space-y-3 max-h-[700px] overflow-y-auto">
                            {filteredPapers.map((paper) => (
                                <div
                                    key={paper.id}
                                    onClick={() => setSelectedPaper(paper)}
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedPaper?.id === paper.id
                                            ? 'border-[#008689] bg-[#e6f7f7]'
                                            : 'border-gray-200 hover:border-[#008689]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                {paper.paperId}
                                            </span>
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                                {paper.track}
                                            </span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${paper.assignedReviewers === 0
                                                ? 'bg-orange-50 text-orange-600'
                                                : paper.assignedReviewers < paper.requiredReviewers
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-green-50 text-green-600'
                                            }`}>
                                            {paper.assignedReviewers}/{paper.requiredReviewers}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                                        {paper.title}
                                    </h3>
                                    <p className="text-xs text-gray-600 mb-2">
                                        <strong>Tác giả:</strong> {paper.authors.join(', ')}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {paper.keywords.map((keyword, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                    {paper.reviewerNames && paper.reviewerNames.length > 0 && (
                                        <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                                            <strong>Reviewers:</strong> {paper.reviewerNames.join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviewers List */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Danh sách Reviewers
                            </h2>
                            {selectedPaper ? (
                                <p className="text-sm text-gray-600 mt-1">
                                    Chọn reviewer cho: <strong>{selectedPaper.paperId}</strong> - {selectedPaper.title.substring(0, 40)}...
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 mt-1">
                                    ← Chọn một bài báo để xem reviewers phù hợp
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 max-h-[700px] overflow-y-auto">
                            {reviewers.map((reviewer) => {
                                const hasCOI = selectedPaper && reviewer.conflicts.includes(selectedPaper.id);
                                const matchScore = selectedPaper ? getMatchScore(selectedPaper, reviewer) : 0;
                                const isOverloaded = reviewer.assignedPapers >= reviewer.maxPapers;

                                return (
                                    <div
                                        key={reviewer.id}
                                        className={`border rounded-lg p-4 ${hasCOI
                                                ? 'border-red-300 bg-red-50'
                                                : isOverloaded
                                                    ? 'border-gray-300 bg-gray-50 opacity-60'
                                                    : 'border-gray-200 hover:border-[#008689]'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Person className="w-5 h-5 text-gray-600" />
                                                    <h3 className="font-semibold text-gray-900">
                                                        {reviewer.name}
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-gray-600">{reviewer.email}</p>
                                            </div>
                                            {selectedPaper && matchScore > 0 && !hasCOI && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                                                    {matchScore.toFixed(0)}% match
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {reviewer.expertise.map((exp, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                                >
                                                    {exp}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">
                                                Đã nhận: {reviewer.assignedPapers}/{reviewer.maxPapers}
                                            </span>

                                            {hasCOI ? (
                                                <div className="flex items-center text-red-600 text-xs">
                                                    <Warning className="w-4 h-4 mr-1" />
                                                    COI
                                                </div>
                                            ) : isOverloaded ? (
                                                <span className="text-xs text-gray-500">Đã đủ</span>
                                            ) : selectedPaper ? (
                                                <button
                                                    onClick={() => handleAssign(selectedPaper.id, reviewer.id)}
                                                    className="px-3 py-1 bg-[#008689] hover:bg-[#006666] text-white text-xs font-medium rounded transition-colors"
                                                >
                                                    <Assignment className="w-3 h-3 inline mr-1" />
                                                    Phân công
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">Chọn bài báo</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaperAssignmentPage;
