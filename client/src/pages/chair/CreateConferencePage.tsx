import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarMonth,
    CloudUpload,
    Add,
    Delete
} from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

const CreateConferencePage = () => {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        // Basic Info
        shortName: '',
        fullName: '',
        startDate: '',
        endDate: '',
        location: '',
        website: '',

        // CFP Details
        cfpTitle: '',
        cfpDescription: '',

        // Deadlines
        submissionDeadline: '',
        reviewDeadline: '',
        cameraReadyDeadline: '',

        // Tracks/Topics
        tracks: [''],

        // Review Settings
        reviewMode: 'double-blind' as 'single-blind' | 'double-blind',
        enableCOI: true,
        minReviewers: 3,

        // PDF
        pdfFile: null as File | null,
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTrackChange = (index: number, value: string) => {
        const newTracks = [...formData.tracks];
        newTracks[index] = value;
        setFormData(prev => ({ ...prev, tracks: newTracks }));
    };

    const addTrack = () => {
        setFormData(prev => ({ ...prev, tracks: [...prev.tracks, ''] }));
    };

    const removeTrack = (index: number) => {
        const newTracks = formData.tracks.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, tracks: newTracks }));
    };

    const handlePdfSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFormData(prev => ({ ...prev, pdfFile: event.target.files![0] }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Conference data:', formData);
        // TODO: Implement API call
        alert('Hội nghị đã được tạo thành công!');
        navigate('/chair/conferences');
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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Thiết lập Hội nghị và Lời mời nộp bài (CFP)
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Tạo hội nghị mới và cấu hình Call for Papers
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Thông tin hội nghị */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Thông tin hội nghị
                        </h2>

                        <div className="space-y-4">
                            {/* Tên viết tắt */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên viết tắt *
                                </label>
                                <input
                                    type="text"
                                    value={formData.shortName}
                                    onChange={(e) => handleInputChange('shortName', e.target.value)}
                                    placeholder="VD: ICCS 2026"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Tên đầy đủ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên đầy đủ *
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    placeholder="VD: International Conference on Computer Science"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày bắt đầu *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            required
                                        />
                                        <CalendarMonth className="absolute right-3 top-2.5 text-gray-400 w-5 h-5 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày kết thúc *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            required
                                        />
                                        <CalendarMonth className="absolute right-3 top-2.5 text-gray-400 w-5 h-5 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Địa điểm */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Địa điểm tổ chức *
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    placeholder="VD: TP. Hồ Chí Minh, Việt Nam"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Website */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Website hội nghị
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                    placeholder="https://conference.example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Lời mời nộp bài (CFP) */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Lời mời nộp bài (CFP)
                        </h2>

                        <div className="space-y-4">
                            {/* CFP Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tiêu đề CFP *
                                </label>
                                <input
                                    type="text"
                                    value={formData.cfpTitle}
                                    onChange={(e) => handleInputChange('cfpTitle', e.target.value)}
                                    placeholder="VD: Call for Papers - ICCS 2026"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* CFP Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả chi tiết *
                                </label>
                                <textarea
                                    value={formData.cfpDescription}
                                    onChange={(e) => handleInputChange('cfpDescription', e.target.value)}
                                    placeholder="Nhập mô tả chi tiết về hội nghị, chủ đề, yêu cầu nộp bài..."
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent resize-none"
                                    required
                                />
                            </div>

                            {/* Tracks/Topics */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chủ đề hội nghị (Tracks)
                                </label>
                                <div className="space-y-2">
                                    {formData.tracks.map((track, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={track}
                                                onChange={(e) => handleTrackChange(index, e.target.value)}
                                                placeholder={`Chủ đề ${index + 1}`}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            />
                                            {formData.tracks.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTrack(index)}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Delete className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addTrack}
                                        className="flex items-center text-[#008689] hover:text-[#006666] font-medium"
                                    >
                                        <Add className="w-5 h-5 mr-1" />
                                        Thêm chủ đề
                                    </button>
                                </div>
                            </div>

                            {/* Deadlines */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hạn nộp bài *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.submissionDeadline}
                                        onChange={(e) => handleInputChange('submissionDeadline', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hạn đánh giá
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.reviewDeadline}
                                        onChange={(e) => handleInputChange('reviewDeadline', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hạn nộp bản cuối
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.cameraReadyDeadline}
                                        onChange={(e) => handleInputChange('cameraReadyDeadline', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Cài đặt đánh giá (Review Settings) */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Cài đặt đánh giá
                        </h2>

                        <div className="space-y-4">
                            {/* Review Mode */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chế độ đánh giá *
                                </label>
                                <select
                                    value={formData.reviewMode}
                                    onChange={(e) => handleInputChange('reviewMode', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                    required
                                >
                                    <option value="single-blind">Single-blind (Reviewer biết tác giả)</option>
                                    <option value="double-blind">Double-blind (Ẩn danh 2 chiều)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.reviewMode === 'double-blind'
                                        ? 'Cả reviewer và tác giả đều ẩn danh với nhau'
                                        : 'Reviewer biết tác giả nhưng tác giả không biết reviewer'}
                                </p>
                            </div>

                            {/* COI Enforcement */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="enableCOI"
                                    checked={formData.enableCOI}
                                    onChange={(e) => handleInputChange('enableCOI', e.target.checked)}
                                    className="w-4 h-4 text-[#008689] border-gray-300 rounded focus:ring-[#008689]"
                                />
                                <label htmlFor="enableCOI" className="ml-2 text-sm font-medium text-gray-700">
                                    Bật kiểm tra xung đột lợi ích (COI)
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 ml-6">
                                Hệ thống sẽ phát hiện và chặn các trường hợp xung đột lợi ích giữa reviewer và tác giả
                            </p>

                            {/* Min Reviewers */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số lượng reviewer tối thiểu cho mỗi bài *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.minReviewers}
                                    onChange={(e) => handleInputChange('minReviewers', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Khuyến nghị: 3 reviewers cho mỗi bài báo
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Tải lên file PDF */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Tải lên file PDF
                        </h2>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#008689] transition-colors">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfSelect}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label htmlFor="pdf-upload" className="cursor-pointer">
                                {formData.pdfFile ? (
                                    <div>
                                        <CloudUpload className="w-16 h-16 text-[#008689] mx-auto mb-4" />
                                        <p className="text-lg font-medium text-[#008689] mb-2">
                                            {formData.pdfFile.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <p className="text-sm text-[#008689] mt-4">
                                            Click để chọn file khác
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-lg text-gray-600 mb-2">
                                            Click để tải lên file PDF
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Tài liệu hướng dẫn, template, hoặc thông tin bổ sung
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            className="px-8 py-3 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                            Tạo hội nghị
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateConferencePage;
