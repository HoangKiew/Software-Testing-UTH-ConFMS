import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarMonth,
    Add,
    Delete
} from '@mui/icons-material';
import { useCreateConferenceMutation } from '../../redux/api/conferencesApi';
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
        cfpDescription: '',

        // Deadlines
        submissionDeadline: '',
        reviewDeadline: '',
        cameraReadyDeadline: '',

        // Tracks/Topics
        tracks: [''],
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

    const [createConference, { isLoading: _creating }] = useCreateConferenceMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Build payload matching backend DTO exactly
        const payload: any = {
            name: formData.fullName,
            acronym: formData.shortName,
            startDate: formData.startDate,
            endDate: formData.endDate,
        };

        // Add optional fields only if they have values
        if (formData.cfpDescription) {
            payload.description = formData.cfpDescription;
        }

        const validTopics = formData.tracks.filter(t => t.trim());
        if (validTopics.length > 0) {
            payload.topics = validTopics;
        }

        const deadlines: any = {};
        if (formData.submissionDeadline) deadlines.submission = formData.submissionDeadline;
        if (formData.reviewDeadline) deadlines.review = formData.reviewDeadline;
        if (formData.cameraReadyDeadline) deadlines.cameraReady = formData.cameraReadyDeadline;
        
        if (Object.keys(deadlines).length > 0) {
            payload.deadlines = deadlines;
        }

        try {
            await createConference(payload).unwrap();
            alert('Hội nghị đã được tạo thành công!');
            navigate('/chair/conferences');
        } catch (err) {
            console.error('Create conference failed', err);
            alert('Tạo hội nghị thất bại: ' + (err as any)?.data?.message || 'Lỗi không xác định');
        }
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
                        </div>
                    </div>

                    {/* Section 2: Lời mời nộp bài (CFP) */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Lời mời nộp bài (CFP)
                        </h2>

                        <div className="space-y-4">
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
