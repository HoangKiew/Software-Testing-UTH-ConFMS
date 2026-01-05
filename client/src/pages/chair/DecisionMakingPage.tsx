import { useState } from 'react';
import {
    Search,
    FilterList,
    Email,
    CheckCircle,
    Cancel,
    Visibility,
    ThumbUp,
    Edit,
    Warning,
    Close
} from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

interface Review {
    reviewerId: number;
    reviewerName: string;
    score: number;
    recommendation: 'Accept' | 'Minor Revision' | 'Major Revision' | 'Reject';
    comments: string;
    strengths: string;
    weaknesses: string;
}

interface Paper {
    id: number;
    paperId: string;
    title: string;
    authors: string[];
    authorEmails: string[];
    track: string;
    abstract: string;
    submittedDate: string;
    reviews: Review[];
    averageScore: number;
    decision?: 'Accept' | 'Minor Revision' | 'Major Revision' | 'Reject';
    decisionComments?: string;
}

const DecisionMakingPage = () => {
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'decided'>('all');
    const [decision, setDecision] = useState<'Accept' | 'Minor Revision' | 'Major Revision' | 'Reject'>('Accept');
    const [decisionComments, setDecisionComments] = useState('');
    const [showEmailPreview, setShowEmailPreview] = useState(false);

    // Mock data
    const papers: Paper[] = [
        {
            id: 1,
            paperId: 'P001',
            title: 'Deep Learning Approaches for Image Recognition in Medical Diagnosis',
            authors: ['Nguyen Van A', 'Tran Thi B'],
            authorEmails: ['nguyenvana@email.com', 'tranthib@email.com'],
            track: 'Artificial Intelligence',
            abstract: 'This paper presents novel deep learning approaches for automated medical image diagnosis...',
            submittedDate: '2026-03-15',
            averageScore: 8.3,
            reviews: [
                {
                    reviewerId: 1,
                    reviewerName: 'Dr. Nguyen Minh Hoang',
                    score: 9,
                    recommendation: 'Accept',
                    comments: 'Excellent work with strong methodology and clear results.',
                    strengths: 'Novel approach, comprehensive experiments, well-written',
                    weaknesses: 'Minor issues with dataset size'
                },
                {
                    reviewerId: 2,
                    reviewerName: 'Prof. Tran Thanh Tung',
                    score: 8,
                    recommendation: 'Accept',
                    comments: 'Good contribution to the field. Some improvements needed in related work section.',
                    strengths: 'Strong technical content, good evaluation',
                    weaknesses: 'Related work could be more comprehensive'
                },
                {
                    reviewerId: 3,
                    reviewerName: 'Dr. Le Thi Mai',
                    score: 8,
                    recommendation: 'Minor Revision',
                    comments: 'Solid work but needs minor revisions before acceptance.',
                    strengths: 'Clear presentation, good results',
                    weaknesses: 'Some experimental details missing'
                }
            ]
        },
        {
            id: 2,
            paperId: 'P002',
            title: 'Blockchain Technology for Secure Data Management in Healthcare',
            authors: ['Le Van C', 'Pham Thi D'],
            authorEmails: ['levanc@email.com', 'phamthid@email.com'],
            track: 'Cybersecurity',
            abstract: 'We propose a blockchain-based framework for secure healthcare data management...',
            submittedDate: '2026-03-16',
            averageScore: 5.7,
            reviews: [
                {
                    reviewerId: 4,
                    reviewerName: 'Assoc. Prof. Pham Van Duc',
                    score: 6,
                    recommendation: 'Major Revision',
                    comments: 'Interesting idea but significant improvements needed.',
                    strengths: 'Relevant topic, practical application',
                    weaknesses: 'Weak evaluation, limited novelty'
                },
                {
                    reviewerId: 2,
                    reviewerName: 'Prof. Tran Thanh Tung',
                    score: 5,
                    recommendation: 'Major Revision',
                    comments: 'The paper needs major revisions in methodology and evaluation.',
                    strengths: 'Good motivation',
                    weaknesses: 'Methodology unclear, experiments insufficient'
                },
                {
                    reviewerId: 3,
                    reviewerName: 'Dr. Le Thi Mai',
                    score: 6,
                    recommendation: 'Major Revision',
                    comments: 'Has potential but requires substantial improvements.',
                    strengths: 'Important problem addressed',
                    weaknesses: 'Technical depth lacking, comparison missing'
                }
            ]
        },
        {
            id: 3,
            paperId: 'P003',
            title: 'Machine Learning for Predictive Maintenance in IoT Systems',
            authors: ['Hoang Van E'],
            authorEmails: ['hoangvane@email.com'],
            track: 'Internet of Things',
            abstract: 'This work explores machine learning techniques for predictive maintenance in IoT environments...',
            submittedDate: '2026-03-17',
            averageScore: 9.0,
            decision: 'Accept',
            decisionComments: 'Excellent contribution with strong technical merit.',
            reviews: [
                {
                    reviewerId: 1,
                    reviewerName: 'Dr. Nguyen Minh Hoang',
                    score: 9,
                    recommendation: 'Accept',
                    comments: 'Outstanding work with significant contributions.',
                    strengths: 'Novel approach, excellent results, well-written',
                    weaknesses: 'None significant'
                },
                {
                    reviewerId: 3,
                    reviewerName: 'Dr. Le Thi Mai',
                    score: 9,
                    recommendation: 'Accept',
                    comments: 'Highly recommend acceptance. Great work!',
                    strengths: 'Strong methodology, comprehensive evaluation',
                    weaknesses: 'Minor presentation issues'
                },
                {
                    reviewerId: 4,
                    reviewerName: 'Assoc. Prof. Pham Van Duc',
                    score: 9,
                    recommendation: 'Accept',
                    comments: 'Excellent paper that should be accepted.',
                    strengths: 'Innovative approach, solid experiments',
                    weaknesses: 'None'
                }
            ]
        }
    ];

    // Filter papers
    const filteredPapers = papers.filter(paper => {
        const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            paper.paperId.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        if (filterStatus === 'pending') matchesFilter = !paper.decision;
        if (filterStatus === 'decided') matchesFilter = !!paper.decision;

        return matchesSearch && matchesFilter;
    });

    const handleSubmitDecision = () => {
        if (!selectedPaper) return;

        if (!decisionComments.trim()) {
            alert('⚠️ Vui lòng nhập nhận xét của Chair trước khi submit!');
            return;
        }

        const confirmMessage = `Xác nhận quyết định "${decision}" cho bài "${selectedPaper.paperId}"?\n\nEmail thông báo sẽ được gửi đến tác giả.`;

        if (window.confirm(confirmMessage)) {
            console.log('Decision submitted:', {
                paperId: selectedPaper.paperId,
                decision,
                comments: decisionComments,
                authorEmails: selectedPaper.authorEmails
            });
            alert(`✅ Đã lưu quyết định "${decision}" cho bài ${selectedPaper.paperId}\n\nEmail thông báo đã được gửi đến tác giả.`);

            // Reset form
            setDecisionComments('');
            setSelectedPaper(null);
        }
    };

    const getDecisionColor = (dec: string) => {
        switch (dec) {
            case 'Accept': return 'text-green-600 bg-green-50';
            case 'Minor Revision': return 'text-blue-600 bg-blue-50';
            case 'Major Revision': return 'text-orange-600 bg-orange-50';
            case 'Reject': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-blue-600';
        if (score >= 4) return 'text-orange-600';
        return 'text-red-600';
    };

    const getDecisionLabel = (decision: string) => {
        const labels: Record<string, string> = {
            'Accept': 'Chấp nhận',
            'Minor Revision': 'Chỉnh sửa nhỏ',
            'Major Revision': 'Chỉnh sửa lớn',
            'Reject': 'Từ chối'
        };
        return labels[decision] || decision;
    };

    const generateEmailPreview = () => {
        if (!selectedPaper) return '';

        const nextSteps = {
            'Accept': 'Xin chúc mừng! Bài báo của bạn đã được chấp nhận. Vui lòng chuẩn bị bản camera-ready theo hướng dẫn đính kèm.',
            'Minor Revision': 'Bài báo cần chỉnh sửa nhỏ. Vui lòng xem xét các nhận xét của reviewers và nộp lại bản sửa đổi trong vòng 2 tuần.',
            'Major Revision': 'Bài báo cần chỉnh sửa lớn. Vui lòng xem xét kỹ các nhận xét và nộp lại bản sửa đổi trong vòng 4 tuần.',
            'Reject': 'Rất tiếc, bài báo chưa đạt yêu cầu để được chấp nhận tại hội nghị này. Cảm ơn bạn đã quan tâm.'
        };

        return `
Kính gửi ${selectedPaper.authors.join(', ')},

Chúng tôi xin thông báo quyết định về bài báo của bạn:

Mã bài: ${selectedPaper.paperId}
Tiêu đề: ${selectedPaper.title}

QUYẾT ĐỊNH: ${decision}

NHẬN XÉT CỦA CHAIR:
${decisionComments}

CHI TIẾT ĐÁNH GIÁ:

${selectedPaper.reviews.map((review, idx) => `
--- Reviewer ${idx + 1} (${review.reviewerName}) ---
Điểm: ${review.score}/10
Khuyến nghị: ${review.recommendation}

Điểm mạnh:
${review.strengths}

Điểm yếu:
${review.weaknesses}

Nhận xét:
${review.comments}
`).join('\n')}

BƯỚC TIẾP THEO:
${nextSteps[decision]}

Trân trọng,
Ban Tổ chức Hội nghị
        `.trim();
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
                    <h1 className="text-3xl font-bold text-gray-900">
                        Đưa ra Quyết định
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Xem xét đánh giá và đưa ra quyết định cuối cùng cho các bài báo
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Tổng số bài</p>
                        <p className="text-2xl font-bold text-gray-900">{papers.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Chờ quyết định</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {papers.filter(p => !p.decision).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-600">Đã quyết định</p>
                        <p className="text-2xl font-bold text-green-600">
                            {papers.filter(p => p.decision).length}
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
                                <option value="pending">Chờ quyết định</option>
                                <option value="decided">Đã quyết định</option>
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
                                    onClick={() => {
                                        setSelectedPaper(paper);
                                        setDecision(paper.decision || 'Accept');
                                        setDecisionComments(paper.decisionComments || '');
                                    }}
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
                                        {paper.decision ? (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getDecisionColor(paper.decision)}`}>
                                                {getDecisionLabel(paper.decision)}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded text-xs font-medium">
                                                Chờ xử lý
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                                        {paper.title}
                                    </h3>
                                    <p className="text-xs text-gray-600 mb-2">
                                        <strong>Tác giả:</strong> {paper.authors.join(', ')}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            {paper.reviews.length} đánh giá
                                        </span>
                                        <span className={`text-sm font-bold ${getScoreColor(paper.averageScore)}`}>
                                            TB: {paper.averageScore.toFixed(1)}/10
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Decision Panel */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Chi tiết & Quyết định
                        </h2>

                        {selectedPaper ? (
                            <div className="space-y-4 max-h-[700px] overflow-y-auto">
                                {/* Paper Info */}
                                <div className="border-b pb-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                                        {selectedPaper.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Mã bài:</strong> {selectedPaper.paperId}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Tác giả:</strong> {selectedPaper.authors.join(', ')}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Track:</strong> {selectedPaper.track}
                                    </p>
                                    <p className={`text-lg font-bold ${getScoreColor(selectedPaper.averageScore)} mt-2`}>
                                        Điểm trung bình: {selectedPaper.averageScore.toFixed(1)}/10
                                    </p>
                                </div>

                                {/* Reviews */}
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3">
                                        Đánh giá từ Reviewers ({selectedPaper.reviews.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedPaper.reviews.map((review, idx) => (
                                            <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-sm text-gray-900">
                                                        Reviewer {idx + 1}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold ${getScoreColor(review.score)}`}>
                                                            {review.score}/10
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDecisionColor(review.recommendation)}`}>
                                                            {getDecisionLabel(review.recommendation)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-xs space-y-1">
                                                    <p><strong>Điểm mạnh:</strong> {review.strengths}</p>
                                                    <p><strong>Điểm yếu:</strong> {review.weaknesses}</p>
                                                    <p><strong>Nhận xét:</strong> {review.comments}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Decision Controls */}
                                {!selectedPaper.decision && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-bold text-gray-900 mb-3">
                                            Quyết định của Chair
                                        </h4>

                                        <div className="space-y-3">
                                            {/* Decision Options */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {([
                                                    { value: 'Accept', label: 'Chấp nhận', icon: <ThumbUp className="w-5 h-5" />, color: 'text-green-600' },
                                                    { value: 'Minor Revision', label: 'Chỉnh sửa nhỏ', icon: <Edit className="w-5 h-5" />, color: 'text-blue-600' },
                                                    { value: 'Major Revision', label: 'Chỉnh sửa lớn', icon: <Warning className="w-5 h-5" />, color: 'text-orange-600' },
                                                    { value: 'Reject', label: 'Từ chối', icon: <Close className="w-5 h-5" />, color: 'text-red-600' }
                                                ] as const).map((opt) => (
                                                    <label
                                                        key={opt.value}
                                                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${decision === opt.value
                                                            ? 'border-[#008689] bg-[#e6f7f7]'
                                                            : 'border-gray-200 hover:border-[#008689]'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="decision"
                                                            value={opt.value}
                                                            checked={decision === opt.value}
                                                            onChange={(e) => setDecision(e.target.value as any)}
                                                            className="w-4 h-4 text-[#008689] mr-2"
                                                        />
                                                        <span className={`${opt.color} mr-2`}>{opt.icon}</span>
                                                        <span className="text-sm font-medium">{opt.label}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Comments */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nhận xét của Chair *
                                                </label>
                                                <textarea
                                                    value={decisionComments}
                                                    onChange={(e) => setDecisionComments(e.target.value)}
                                                    placeholder="Nhập nhận xét và lý do quyết định..."
                                                    rows={4}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent resize-none text-sm"
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowEmailPreview(true)}
                                                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                                >
                                                    <Visibility className="w-4 h-4 mr-2" />
                                                    Xem trước Email
                                                </button>
                                                <button
                                                    onClick={handleSubmitDecision}
                                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-colors text-sm"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Gửi quyết định
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Already Decided */}
                                {selectedPaper.decision && (
                                    <div className="border-t pt-4">
                                        <div className={`p-4 rounded-lg ${getDecisionColor(selectedPaper.decision)}`}>
                                            <div className="flex items-center mb-2">
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                <span className="font-bold">
                                                    Quyết định: {getDecisionLabel(selectedPaper.decision)}
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                <strong>Nhận xét:</strong> {selectedPaper.decisionComments}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                ← Chọn một bài báo để xem chi tiết và đưa ra quyết định
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Email Preview Modal */}
            {showEmailPreview && selectedPaper && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between">
                            <div className="flex items-center">
                                <Email className="w-6 h-6 text-[#008689] mr-2" />
                                <h3 className="text-xl font-bold text-gray-900">
                                    Xem trước Email
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowEmailPreview(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Cancel className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded-lg">
                                {generateEmailPreview()}
                            </pre>
                        </div>
                        <div className="p-6 border-t bg-gray-50">
                            <button
                                onClick={() => setShowEmailPreview(false)}
                                className="w-full px-4 py-2 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecisionMakingPage;
