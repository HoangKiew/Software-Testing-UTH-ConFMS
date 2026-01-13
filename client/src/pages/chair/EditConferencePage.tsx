import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    CalendarMonth,
    Add,
    Delete,
    Edit as EditIcon
} from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';
import { useGetConferenceByIdQuery, useUpdateConferenceMutation } from '../../redux/api/conferencesApi';

const EditConferencePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { data: conference, isLoading } = useGetConferenceByIdQuery(id || '', {
        skip: !id,
    });
    const [updateConference] = useUpdateConferenceMutation();

    // Form state
    const [formData, setFormData] = useState({
        shortName: '',
        fullName: '',
        startDate: '',
        endDate: '',
        cfpDescription: '',
        submissionDeadline: '',
        reviewDeadline: '',
        cameraReadyDeadline: '',
        tracks: [''],
    });

    // Load conference data from API
    useEffect(() => {
        if (conference) {
            setFormData({
                shortName: conference.acronym || '',
                fullName: conference.name || '',
                startDate: conference.startDate?.split('T')[0] || '',
                endDate: conference.endDate?.split('T')[0] || '',
                cfpDescription: conference.description || '',
                submissionDeadline: conference.deadlines?.submission?.split('T')[0] || '',
                reviewDeadline: conference.deadlines?.review?.split('T')[0] || '',
                cameraReadyDeadline: conference.deadlines?.cameraReady?.split('T')[0] || '',
                tracks: conference.topics && conference.topics.length > 0 ? conference.topics : [''],
            });
        }
    }, [conference]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload: any = {
            name: formData.fullName,
            acronym: formData.shortName,
            startDate: formData.startDate,
            endDate: formData.endDate,
        };
        
        if (formData.cfpDescription) payload.description = formData.cfpDescription;
        
        const validTopics = formData.tracks.filter(t => t.trim());
        if (validTopics.length > 0) payload.topics = validTopics;
        
        const deadlines: any = {};
        if (formData.submissionDeadline) deadlines.submission = formData.submissionDeadline;
        if (formData.reviewDeadline) deadlines.review = formData.reviewDeadline;
        if (formData.cameraReadyDeadline) deadlines.cameraReady = formData.cameraReadyDeadline;
        if (Object.keys(deadlines).length > 0) payload.deadlines = deadlines;
        
        console.log('🔍 Update payload:', JSON.stringify(payload, null, 2));
        console.log('🔍 Conference ID:', id);
        
        try {
            await updateConference({ id: id!, data: payload }).unwrap();
            alert('✅ Hội nghị đã được cập nhật thành công!');
            navigate(`/chair/conferences/${id}`);
        } catch (err) {
            console.error('❌ Update failed:', err);
            console.error('❌ Error details:', JSON.stringify(err, null, 2));
            const errorMsg = (err as any)?.data?.message || (err as any)?.message || 'Lỗi không xác định';
            alert('Cập nhật hội nghị thất bại!\n' + errorMsg);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-xl text-gray-600">Đang tải dữ liệu...</p>
            </div>
        );
    }

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
                    <div className="flex items-center mb-2">
                        <EditIcon className="w-8 h-8 text-[#008689] mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">
                            Chỉnh sửa Hội nghị
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Cập nhật thông tin hội nghị và cấu hình Call for Papers
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
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditConferencePage;
