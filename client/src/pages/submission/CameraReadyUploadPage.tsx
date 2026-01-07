import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowBack,
    CloudUpload,
    CheckCircle,
    Description,
    Info
} from '@mui/icons-material';

interface Submission {
    id: number;
    title: string;
    conference: string;
    status: string;
}

const CameraReadyUploadPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [finalPdf, setFinalPdf] = useState<File | null>(null);
    const [copyrightForm, setCopyrightForm] = useState<File | null>(null);
    const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);

    // Mock data
    const submissionsData: Record<number, Submission> = {
        3: {
            id: 3,
            title: 'Machine Learning for Traffic Prediction',
            conference: 'ICCS 2026',
            status: 'Accepted'
        }
    };

    const submission = submissionsData[parseInt(id || '0')];

    if (!submission || submission.status !== 'Accepted') {
        return (
            <div className="min-h-screen bg-gray-50 py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Không thể truy cập
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Chỉ các bài đã được chấp nhận mới có thể upload camera-ready version.
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

    const handleFinalPdfSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFinalPdf(event.target.files[0]);
        }
    };

    const handleCopyrightFormSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setCopyrightForm(event.target.files[0]);
        }
    };

    const handleAdditionalFilesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setAdditionalFiles(Array.from(event.target.files));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!finalPdf) {
            alert('Vui lòng upload file PDF camera-ready!');
            return;
        }
        if (!copyrightForm) {
            alert('Vui lòng upload copyright form!');
            return;
        }
        console.log('Upload camera-ready:', { finalPdf, copyrightForm, additionalFiles });
        // TODO: Implement upload logic
        alert('Upload thành công!');
        navigate(`/submissions/${id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/submissions/${id}`)}
                    className="flex items-center text-gray-600 hover:text-[#008689] mb-6 transition-colors"
                >
                    <ArrowBack className="w-5 h-5 mr-2" />
                    Quay lại chi tiết bài nộp
                </button>

                {/* Page Header */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <div className="flex items-start mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600 mr-3 mt-1" />
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Upload Camera-ready Version
                            </h1>
                            <p className="text-gray-600 mb-2">
                                <span className="font-medium">Bài báo:</span> {submission.title}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-medium">Hội nghị:</span> {submission.conference}
                            </p>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <div className="flex items-start">
                            <Info className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                            <div className="text-sm text-green-800">
                                <p className="font-semibold mb-1">Chúc mừng! Bài báo của bạn đã được chấp nhận.</p>
                                <p>Vui lòng upload bản camera-ready và các tài liệu cần thiết trước deadline.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Final PDF Upload */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Description className="w-6 h-6 mr-2 text-[#008689]" />
                            Camera-ready PDF *
                        </h2>

                        <div className="mb-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h3 className="font-semibold text-blue-900 mb-2">Yêu cầu:</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• File PDF đã được format theo template của hội nghị</li>
                                    <li>• Đã áp dụng tất cả các góp ý từ reviewers</li>
                                    <li>• Không có watermark hoặc header/footer không cần thiết</li>
                                    <li>• Tối đa 10MB</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#008689] transition-colors">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFinalPdfSelect}
                                className="hidden"
                                id="final-pdf-upload"
                            />
                            <label htmlFor="final-pdf-upload" className="cursor-pointer">
                                <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                {finalPdf ? (
                                    <div>
                                        <p className="text-base font-medium text-[#008689] mb-1">
                                            {finalPdf.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {(finalPdf.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <p className="text-sm text-[#008689] mt-2">
                                            Click để chọn file khác
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-base text-gray-600 mb-1">
                                            Click để chọn file PDF camera-ready
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Chỉ chấp nhận file PDF, tối đa 10MB
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Copyright Form Upload */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Description className="w-6 h-6 mr-2 text-[#008689]" />
                            Copyright Form *
                        </h2>

                        <div className="mb-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <h3 className="font-semibold text-yellow-900 mb-2">Lưu ý:</h3>
                                <ul className="text-sm text-yellow-800 space-y-1">
                                    <li>• Tải form từ website hội nghị</li>
                                    <li>• Điền đầy đủ thông tin và ký tên</li>
                                    <li>• Scan hoặc chụp rõ ràng</li>
                                    <li>• Upload dưới dạng PDF</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#008689] transition-colors">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleCopyrightFormSelect}
                                className="hidden"
                                id="copyright-form-upload"
                            />
                            <label htmlFor="copyright-form-upload" className="cursor-pointer">
                                <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                {copyrightForm ? (
                                    <div>
                                        <p className="text-base font-medium text-[#008689] mb-1">
                                            {copyrightForm.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {(copyrightForm.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <p className="text-sm text-[#008689] mt-2">
                                            Click để chọn file khác
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-base text-gray-600 mb-1">
                                            Click để chọn copyright form
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            File PDF đã ký
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Additional Materials Upload */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <CloudUpload className="w-6 h-6 mr-2 text-[#008689]" />
                            Additional Materials (Tùy chọn)
                        </h2>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Upload các tài liệu bổ sung như source code, datasets, supplementary materials, v.v.
                            </p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#008689] transition-colors">
                            <input
                                type="file"
                                multiple
                                onChange={handleAdditionalFilesSelect}
                                className="hidden"
                                id="additional-files-upload"
                            />
                            <label htmlFor="additional-files-upload" className="cursor-pointer">
                                <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                {additionalFiles.length > 0 ? (
                                    <div>
                                        <p className="text-base font-medium text-[#008689] mb-2">
                                            {additionalFiles.length} file(s) đã chọn
                                        </p>
                                        <div className="space-y-1 mb-3">
                                            {additionalFiles.map((file, index) => (
                                                <p key={index} className="text-sm text-gray-600">
                                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                </p>
                                            ))}
                                        </div>
                                        <p className="text-sm text-[#008689]">
                                            Click để chọn file khác
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-base text-gray-600 mb-1">
                                            Click để chọn các file bổ sung
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Có thể chọn nhiều file cùng lúc
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
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            className="px-8 py-3 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-colors duration-200"
                        >
                            Upload Camera-ready
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CameraReadyUploadPage;
