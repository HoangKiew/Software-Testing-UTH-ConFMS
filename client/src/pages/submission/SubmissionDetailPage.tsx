import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowBack,
    Description,
    CalendarMonth,
    CheckCircle,
    Schedule,
    RateReview,
    CloudUpload,
    Info
} from '@mui/icons-material';

type SubmissionStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

interface Review {
    reviewerName: string;
    rating: number;
    comments: string;
    date: string;
}

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
    keywords: string[];
    pdfFile: string;
    reviews?: Review[];
    decisionDate?: string;
    decisionComments?: string;
}

const SubmissionDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
            abstract: 'This paper presents a novel approach to image classification using deep learning techniques. We propose a new architecture that combines convolutional neural networks with attention mechanisms to improve classification accuracy on large-scale datasets.',
            keywords: ['Deep Learning', 'Image Classification', 'CNN', 'Attention Mechanism'],
            pdfFile: 'paper_1.pdf',
            reviews: [
                {
                    reviewerName: 'Reviewer #1',
                    rating: 4,
                    comments: 'The paper presents an interesting approach. The experimental results are promising. However, the comparison with state-of-the-art methods could be more comprehensive.',
                    date: '2025-12-20'
                },
                {
                    reviewerName: 'Reviewer #2',
                    rating: 3,
                    comments: 'The methodology is sound, but the paper lacks clarity in some sections. The authors should revise the introduction and related work sections.',
                    date: '2025-12-22'
                }
            ]
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
            abstract: 'This research applies machine learning techniques to predict traffic patterns in urban areas. We develop a model that can accurately forecast traffic congestion based on historical data and real-time inputs.',
            keywords: ['Machine Learning', 'Traffic Prediction', 'Urban Computing'],
            pdfFile: 'paper_3.pdf',
            reviews: [
                {
                    reviewerName: 'Reviewer #1',
                    rating: 5,
                    comments: 'Excellent work! The paper is well-written and the results are impressive. I recommend acceptance.',
                    date: '2025-11-25'
                },
                {
                    reviewerName: 'Reviewer #2',
                    rating: 4,
                    comments: 'Good paper with solid contributions. Minor revisions needed before final publication.',
                    date: '2025-11-27'
                }
            ],
            decisionDate: '2025-12-01',
            decisionComments: 'Congratulations! Your paper has been accepted for presentation at ICCS 2026. Please submit the camera-ready version by May 10, 2026.'
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
            abstract: 'We explore the application of blockchain technology in supply chain systems to improve transparency and traceability.',
            keywords: ['Blockchain', 'Supply Chain', 'Transparency'],
            pdfFile: 'paper_4.pdf',
            reviews: [
                {
                    reviewerName: 'Reviewer #1',
                    rating: 2,
                    comments: 'The paper lacks novelty. The proposed approach is similar to existing solutions. The evaluation is insufficient.',
                    date: '2025-10-20'
                }
            ],
            decisionDate: '2025-10-25',
            decisionComments: 'Unfortunately, your paper has not been accepted. The reviewers found that the work lacks sufficient novelty and the evaluation needs significant improvement.'
        }
    ];

    const submission = submissions.find(s => s.id === parseInt(id || '0'));

    if (!submission) {
        return (
            <div className="min-h-screen bg-gray-50 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Không tìm thấy bài nộp
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Bài nộp bạn đang tìm kiếm không tồn tại.
                    </p>
                    <Link
                        to="/my-submissions"
                        className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        <ArrowBack className="w-5 h-5 mr-2" />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

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

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUploadCameraReady = () => {
        if (selectedFile) {
            console.log('Upload camera-ready:', selectedFile);
            // TODO: Implement upload logic
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/my-submissions')}
                    className="flex items-center text-gray-600 hover:text-[#008689] mb-6 transition-colors"
                >
                    <ArrowBack className="w-5 h-5 mr-2" />
                    Quay lại danh sách bài nộp
                </button>

                {/* Paper Header */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">
                                {submission.title}
                            </h1>
                            <p className="text-gray-600 mb-2">
                                <span className="font-medium">Hội nghị:</span> {submission.conference}
                            </p>
                            <p className="text-gray-600 mb-4">
                                <span className="font-medium">Tác giả:</span> {submission.authors.join(', ')}
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(submission.status)}`}>
                            {submission.status === 'Submitted' ? 'Đã nộp' :
                                submission.status === 'Under Review' ? 'Đang đánh giá' :
                                    submission.status === 'Accepted' ? 'Chấp nhận' : 'Từ chối'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center text-gray-700">
                            <CalendarMonth className="w-5 h-5 mr-2 text-[#008689]" />
                            <div>
                                <p className="text-sm text-gray-500">Ngày nộp</p>
                                <p className="font-medium">{new Date(submission.submittedDate).toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                            <Schedule className="w-5 h-5 mr-2 text-[#008689]" />
                            <div>
                                <p className="text-sm text-gray-500">Deadline</p>
                                <p className="font-medium">{new Date(submission.deadline).toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>

                        <div className="flex items-center text-gray-700">
                            <Description className="w-5 h-5 mr-2 text-[#008689]" />
                            <div>
                                <p className="text-sm text-gray-500">File</p>
                                <p className="font-medium text-[#008689]">{submission.pdfFile}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Abstract */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Abstract
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                                {submission.abstract}
                            </p>
                        </div>

                        {/* Keywords */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Keywords
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {submission.keywords.map(keyword => (
                                    <span
                                        key={keyword}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Reviews */}
                        {submission.reviews && submission.reviews.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <RateReview className="w-6 h-6 mr-2 text-[#008689]" />
                                    Reviews
                                </h3>
                                <div className="space-y-4">
                                    {submission.reviews.map((review, index) => (
                                        <div key={index} className="border-l-4 border-[#008689] pl-4 py-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-semibold text-gray-900">
                                                    {review.reviewerName}
                                                </p>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-500 mr-2">Rating:</span>
                                                    <span className="font-semibold text-[#008689]">
                                                        {review.rating}/5
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {new Date(review.date).toLocaleDateString('vi-VN')}
                                            </p>
                                            <p className="text-gray-700">
                                                {review.comments}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Decision */}
                        {submission.decisionDate && submission.decisionComments && (
                            <div className={`rounded-lg shadow-sm p-6 ${submission.status === 'Accepted' ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                                }`}>
                                <h3 className="text-xl font-bold mb-4 flex items-center">
                                    <Info className={`w-6 h-6 mr-2 ${submission.status === 'Accepted' ? 'text-green-600' : 'text-red-600'}`} />
                                    <span className={submission.status === 'Accepted' ? 'text-green-900' : 'text-red-900'}>
                                        Decision Notification
                                    </span>
                                </h3>
                                <p className={`text-sm mb-2 ${submission.status === 'Accepted' ? 'text-green-700' : 'text-red-700'}`}>
                                    {new Date(submission.decisionDate).toLocaleDateString('vi-VN')}
                                </p>
                                <p className={submission.status === 'Accepted' ? 'text-green-900' : 'text-red-900'}>
                                    {submission.decisionComments}
                                </p>
                            </div>
                        )}

                        {/* Camera-ready Upload */}
                        {submission.status === 'Accepted' && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <CloudUpload className="w-6 h-6 mr-2 text-[#008689]" />
                                    Upload Camera-ready Version
                                </h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="camera-ready-upload"
                                    />
                                    <label htmlFor="camera-ready-upload" className="cursor-pointer">
                                        <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        {selectedFile ? (
                                            <div>
                                                <p className="text-base font-medium text-[#008689] mb-1">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-sm text-gray-500 mb-4">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                <button
                                                    onClick={handleUploadCameraReady}
                                                    className="px-6 py-2 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                                                >
                                                    Upload File
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-base text-gray-600 mb-1">
                                                    Click để chọn file PDF
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Camera-ready version (tối đa 10MB)
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Timeline */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="w-6 h-6 mr-2 text-[#008689]" />
                                Status Timeline
                            </h3>
                            <div className="space-y-4">
                                <div className="relative pl-6 pb-4 border-l-2 border-[#008689]">
                                    <div className="absolute left-0 top-0 w-3 h-3 bg-[#008689] rounded-full -translate-x-[7px]"></div>
                                    <p className="font-medium text-gray-900 text-sm mb-1">
                                        Submitted
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(submission.submittedDate).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>

                                {submission.reviews && submission.reviews.length > 0 && (
                                    <div className="relative pl-6 pb-4 border-l-2 border-[#008689]">
                                        <div className="absolute left-0 top-0 w-3 h-3 bg-[#008689] rounded-full -translate-x-[7px]"></div>
                                        <p className="font-medium text-gray-900 text-sm mb-1">
                                            Under Review
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {submission.reviews.length} review(s)
                                        </p>
                                    </div>
                                )}

                                {submission.decisionDate && (
                                    <div className="relative pl-6">
                                        <div className={`absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px] ${submission.status === 'Accepted' ? 'bg-green-600' : 'bg-red-600'
                                            }`}></div>
                                        <p className="font-medium text-gray-900 text-sm mb-1">
                                            {submission.status === 'Accepted' ? 'Accepted' : 'Rejected'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(submission.decisionDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                )}

                                {submission.status === 'Under Review' && !submission.decisionDate && (
                                    <div className="relative pl-6">
                                        <div className="absolute left-0 top-0 w-3 h-3 bg-gray-300 rounded-full -translate-x-[7px]"></div>
                                        <p className="font-medium text-gray-500 text-sm mb-1">
                                            Decision Pending
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Waiting for decision
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetailPage;
