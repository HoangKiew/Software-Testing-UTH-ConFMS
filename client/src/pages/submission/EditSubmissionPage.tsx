import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Add, CloudUpload, Close, ArrowBack } from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

interface CoAuthor {
    id: number;
    name: string;
    email: string;
    affiliation: string;
}

interface Submission {
    id: number;
    title: string;
    abstract: string;
    keywords: string;
    mainAuthor: {
        name: string;
        email: string;
        affiliation: string;
    };
    coAuthors: CoAuthor[];
    pdfFile: string;
}

const EditSubmissionPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Mock data - same as in other pages
    const submissionsData: Record<number, Submission> = {
        1: {
            id: 1,
            title: 'Deep Learning Approaches for Image Classification',
            abstract: 'This paper presents a novel approach to image classification using deep learning techniques. We propose a new architecture that combines convolutional neural networks with attention mechanisms to improve classification accuracy on large-scale datasets.',
            keywords: 'Deep Learning, Image Classification, CNN, Attention Mechanism',
            mainAuthor: {
                name: 'Nguyễn Văn A',
                email: 'nguyenvana@example.com',
                affiliation: 'Trường Đại học Giao thông Vận tải TP.HCM'
            },
            coAuthors: [
                {
                    id: 1,
                    name: 'Trần Thị B',
                    email: 'tranthib@example.com',
                    affiliation: 'Đại học Bách Khoa TP.HCM'
                }
            ],
            pdfFile: 'paper_1.pdf'
        },
        2: {
            id: 2,
            title: 'Microservices Architecture for Scalable Applications',
            abstract: 'We propose a microservices-based architecture for building scalable web applications. The approach includes containerization, service discovery, and load balancing strategies.',
            keywords: 'Microservices, Scalability, Docker, Kubernetes',
            mainAuthor: {
                name: 'Nguyễn Văn A',
                email: 'nguyenvana@example.com',
                affiliation: 'Trường Đại học Giao thông Vận tải TP.HCM'
            },
            coAuthors: [
                {
                    id: 1,
                    name: 'Lê Văn C',
                    email: 'levanc@example.com',
                    affiliation: 'Đại học Quốc Gia TP.HCM'
                }
            ],
            pdfFile: 'paper_2.pdf'
        }
    };

    const submission = submissionsData[parseInt(id || '0')];

    const [title, setTitle] = useState('');
    const [abstract, setAbstract] = useState('');
    const [keywords, setKeywords] = useState('');
    const [mainAuthor, setMainAuthor] = useState({ name: '', email: '', affiliation: '' });
    const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([{ id: 1, name: '', email: '', affiliation: '' }]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentPdfFile, setCurrentPdfFile] = useState('');

    useEffect(() => {
        if (submission) {
            setTitle(submission.title);
            setAbstract(submission.abstract);
            setKeywords(submission.keywords);
            setMainAuthor(submission.mainAuthor);
            setCoAuthors(submission.coAuthors);
            setCurrentPdfFile(submission.pdfFile);
        }
    }, [submission]);

    if (!submission) {
        return (
            <div className="min-h-screen bg-gray-50 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Không tìm thấy bài nộp
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Bài nộp bạn muốn chỉnh sửa không tồn tại.
                    </p>
                    <button
                        onClick={() => navigate('/my-submissions')}
                        className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        <ArrowBack className="w-5 h-5 mr-2" />
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const addCoAuthor = () => {
        const newId = coAuthors.length > 0 ? Math.max(...coAuthors.map(a => a.id)) + 1 : 1;
        setCoAuthors([...coAuthors, { id: newId, name: '', email: '', affiliation: '' }]);
    };

    const removeCoAuthor = (id: number) => {
        if (coAuthors.length > 1) {
            setCoAuthors(coAuthors.filter(author => author.id !== id));
        }
    };

    const updateCoAuthor = (id: number, field: keyof CoAuthor, value: string) => {
        setCoAuthors(coAuthors.map(author =>
            author.id === id ? { ...author, [field]: value } : author
        ));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Update submission:', { title, abstract, keywords, mainAuthor, coAuthors, selectedFile });
        // TODO: Implement update logic
        navigate('/my-submissions');
    };

    return (
        <div
            className="min-h-screen py-8 px-4"
            style={{
                backgroundImage: `url(${bgUth})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#e0f2f1',
            }}
        >
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/submissions/${id}`)}
                    className="flex items-center text-gray-600 hover:text-[#008689] mb-6 transition-colors"
                >
                    <ArrowBack className="w-5 h-5 mr-2" />
                    Quay lại chi tiết bài nộp
                </button>

                {/* Page Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Chỉnh sửa Bài nộp
                            </h1>
                            <p className="text-sm text-gray-600">
                                Cập nhật thông tin bài nghiên cứu của bạn
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Paper Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4">
                            Thông tin bài viết
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tiêu đề của bài viết *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nhập tiêu đề bài nghiên cứu của bạn"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tóm tắt *
                                </label>
                                <textarea
                                    placeholder="Nhập tóm tắt bài viết (tối đa 250 từ - 300 từ)"
                                    rows={4}
                                    value={abstract}
                                    onChange={(e) => setAbstract(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] resize-none text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Từ khóa *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nhập các từ khóa, cách nhau bằng dấu phẩy"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Author Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4">
                            Thông tin tác giả chính
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    value={mainAuthor.name}
                                    onChange={(e) => setMainAuthor({ ...mainAuthor, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    placeholder="email@gmail.com"
                                    value={mainAuthor.email}
                                    onChange={(e) => setMainAuthor({ ...mainAuthor, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Cơ quan / Tổ chức *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Trường Đại học Giao thông Vận tải TP.HCM"
                                    value={mainAuthor.affiliation}
                                    onChange={(e) => setMainAuthor({ ...mainAuthor, affiliation: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Co-Authors */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-gray-900">
                                Đồng tác giả
                            </h2>
                            <button
                                type="button"
                                onClick={addCoAuthor}
                                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-white border border-[#008689] text-[#008689] hover:bg-[#008689] hover:text-white rounded-md transition-colors duration-200"
                            >
                                <Add className="w-4 h-4" />
                                <span>Thêm đồng tác giả</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {coAuthors.map((author) => (
                                <div key={author.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Họ và tên
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            value={author.name}
                                            onChange={(e) => updateCoAuthor(author.id, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="email@gmail.com"
                                            value={author.email}
                                            onChange={(e) => updateCoAuthor(author.id, 'email', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Cơ quan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Tên cơ quan"
                                            value={author.affiliation}
                                            onChange={(e) => updateCoAuthor(author.id, 'affiliation', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008689] focus:border-[#008689] text-sm bg-gray-50"
                                        />
                                    </div>

                                    {coAuthors.length > 1 && (
                                        <div className="pb-0.5">
                                            <button
                                                type="button"
                                                onClick={() => removeCoAuthor(author.id)}
                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                                title="Xóa đồng tác giả"
                                            >
                                                <Close className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PDF Upload */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4">
                            Tải lên file PDF mới (tùy chọn)
                        </h2>

                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <span className="font-medium">File hiện tại:</span> {currentPdfFile}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Chỉ upload file mới nếu bạn muốn thay thế file hiện tại
                            </p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#008689] transition-colors">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label htmlFor="pdf-upload" className="cursor-pointer">
                                <CloudUpload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                {selectedFile ? (
                                    <div>
                                        <p className="text-sm font-medium text-[#008689] mb-1">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <p className="text-xs text-[#008689] mt-1">
                                            Click để chọn file khác
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Kéo thả file PDF vào đây
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Chỉ chấp nhận file PDF, tối đa 10MB
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(`/submissions/${id}`)}
                            className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-md transition-colors duration-200 text-sm"
                        >
                            Cập nhật bài nộp
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSubmissionPage;
