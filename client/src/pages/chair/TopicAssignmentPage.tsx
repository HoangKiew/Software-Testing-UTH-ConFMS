import { useState, useEffect } from 'react';
import { Search, Person, Assignment, AutoAwesome, FilterList } from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

// ── API hooks ──
import {
    useSuggestReviewersForTopicQuery,
    useAssignReviewersToTopicMutation,
    useGetAssignmentsByConferenceQuery,
} from '../../redux/api/assignmentsApi';

// Giả định bạn đã có slice conferencesApi với endpoint này
import { useGetConferencesQuery } from '../../redux/api/conferencesApi'; // Nếu chưa có → cần tạo

const TopicAssignmentPage = () => {
    const [selectedConferenceId, setSelectedConferenceId] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [topN, setTopN] = useState(5);

    // Lấy danh sách hội nghị mà Chair đang quản lý
    const {
        data: conferences = [],
        isLoading: loadingConfs,
        isError: confError,
    } = useGetConferencesQuery({}); // Có thể thêm { status: 'Active' } nếu muốn lọc

    // Tự động chọn hội nghị đầu tiên nếu chỉ có 1 hội nghị
    useEffect(() => {
        if (conferences.length === 1 && !selectedConferenceId) {
            setSelectedConferenceId(conferences[0].id);
        }
    }, [conferences, selectedConferenceId]);

    // Lấy assignments của hội nghị đã chọn
    const { data: assignments = [] } = useGetAssignmentsByConferenceQuery(
        selectedConferenceId!,
        { skip: !selectedConferenceId }
    );

    // Gợi ý reviewer khi đã chọn topic
    const { data: suggestions = [] } = useSuggestReviewersForTopicQuery(
        { conferenceId: selectedConferenceId!, topic: selectedTopic || '', top: topN },
        { skip: !selectedConferenceId || !selectedTopic }
    );

    const [assignReviewers] = useAssignReviewersToTopicMutation();

    // Lấy topics từ hội nghị đã chọn (fallback nếu API chưa trả về)
    const selectedConf = conferences.find((c: any) => c.id === selectedConferenceId);
    const topics = selectedConf?.topics?.length > 0
        ? selectedConf.topics
        : ['Artificial Intelligence', 'Cybersecurity', 'Data Science', 'IoT']; // fallback

    const handleAssign = async (reviewerId: number) => {
        if (!selectedTopic || !selectedConferenceId) return;
        try {
            await assignReviewers({
                conferenceId: selectedConferenceId,
                topic: selectedTopic,
                reviewerIds: [reviewerId],
            }).unwrap();
            alert(`Đã phân công reviewer cho topic "${selectedTopic}"`);
        } catch (err: any) {
            alert('Phân công thất bại: ' + (err.data?.message || 'Lỗi hệ thống'));
        }
    };

    const handleAutoAssign = () => {
        if (!selectedTopic || suggestions.length === 0 || !selectedConferenceId) return;
        const topIds = suggestions.slice(0, 3).map((r: any) => r.reviewerId);
        assignReviewers({
            conferenceId: selectedConferenceId,
            topic: selectedTopic,
            reviewerIds: topIds,
        })
            .unwrap()
            .then(() => alert('Đã tự động phân công top reviewers!'))
            .catch((err) => alert('Lỗi: ' + (err.data?.message || 'Không thể phân công')));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ backgroundImage: `url(${bgUth})`, backgroundSize: 'cover' }}>
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-3xl font-bold">Phân công Reviewer theo Topic</h1>
                </div>

                {/* ── Chọn hội nghị ── */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Chọn Hội nghị cần phân công</h2>

                    {loadingConfs ? (
                        <p className="text-gray-600">Đang tải danh sách hội nghị...</p>
                    ) : confError ? (
                        <p className="text-red-600">Không thể tải danh sách hội nghị. Vui lòng thử lại sau.</p>
                    ) : conferences.length === 0 ? (
                        <p className="text-gray-600">
                            Bạn chưa quản lý hội nghị nào. Hãy tạo hội nghị mới tại{' '}
                            <a href="/chair/conferences/create" className="text-[#008689] underline">
                                đây
                            </a>.
                        </p>
                    ) : (
                        <select
                            value={selectedConferenceId || ''}
                            onChange={(e) => {
                                setSelectedConferenceId(e.target.value || null);
                                setSelectedTopic(null); // reset topic khi đổi hội nghị
                            }}
                            className="w-full max-w-md border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#008689] focus:ring-1 focus:ring-[#008689]"
                        >
                            <option value="">-- Chọn một hội nghị --</option>
                            {conferences.map((conf: any) => (
                                <option key={conf.id} value={conf.id}>
                                    {conf.name} {conf.acronym ? `(${conf.acronym})` : ''} - ID: {conf.id.slice(0, 8)}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Chỉ hiển thị nội dung chính khi đã chọn hội nghị */}
                {selectedConferenceId ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Danh sách Topics */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold mb-4">Topics của hội nghị</h2>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {topics.map((topic: string) => (
                                        <button
                                            key={topic}
                                            onClick={() => setSelectedTopic(topic)}
                                            className={`w-full text-left p-3 rounded border transition-colors ${selectedTopic === topic
                                                    ? 'border-[#008689] bg-[#e6f7f7] text-[#008689]'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gợi ý & Phân công */}
                            <div className="bg-white rounded-lg shadow p-6">
                                {selectedTopic ? (
                                    <>
                                        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                            <h2 className="text-xl font-bold">Gợi ý Reviewer cho: {selectedTopic}</h2>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-medium">Hiển thị top:</label>
                                                <select
                                                    value={topN}
                                                    onChange={(e) => setTopN(Number(e.target.value))}
                                                    className="border rounded px-3 py-1 text-sm focus:outline-none focus:border-[#008689]"
                                                >
                                                    <option value={3}>3</option>
                                                    <option value={5}>5</option>
                                                    <option value={8}>8</option>
                                                    <option value={10}>10</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAutoAssign}
                                            disabled={suggestions.length === 0}
                                            className="mb-6 flex items-center px-5 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                        >
                                            <AutoAwesome className="mr-2" /> Auto-assign top reviewers
                                        </button>

                                        <div className="space-y-4">
                                            {suggestions.length > 0 ? (
                                                suggestions.map((sug: any) => (
                                                    <div
                                                        key={sug.reviewerId}
                                                        className="border rounded-lg p-4 hover:border-[#008689] transition"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-medium">{sug.name || 'Reviewer'}</div>
                                                                <div className="text-sm text-gray-600">{sug.email || '—'}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-green-600 font-bold text-lg">
                                                                    {sug.score ? `${(sug.score * 100).toFixed(1)}%` : '—'}
                                                                </div>
                                                                <div className="text-xs text-gray-500">độ phù hợp</div>
                                                            </div>
                                                        </div>

                                                        {sug.expertise?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-3">
                                                                {sug.expertise.map((exp: string) => (
                                                                    <span
                                                                        key={exp}
                                                                        className="px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded-full"
                                                                    >
                                                                        {exp}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => handleAssign(sug.reviewerId)}
                                                            className="mt-4 px-5 py-1.5 bg-[#008689] text-white text-sm rounded hover:bg-[#006666] transition"
                                                        >
                                                            <Assignment className="inline mr-1 text-sm" /> Phân công
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-gray-500">
                                                    Không có gợi ý reviewer nào cho topic này
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-16 text-gray-500">
                                        ← Vui lòng chọn một topic để xem gợi ý reviewer
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Phân công hiện tại */}
                        <div className="bg-white rounded-lg shadow p-6 mt-6">
                            <h2 className="text-xl font-bold mb-4">Phân công hiện tại của hội nghị</h2>
                            <div className="space-y-3">
                                {assignments.length > 0 ? (
                                    assignments.map((assign: any) => (
                                        <div key={assign.topic} className="border rounded p-4 bg-gray-50">
                                            <strong className="block mb-1">{assign.topic}</strong>
                                            <div className="text-gray-700">
                                                {assign.reviewers?.map((r: any) => r.name).join(', ') || 'Chưa có reviewer nào được phân công'}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-6">
                                        Chưa có phân công nào cho hội nghị này
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600 mt-6">
                        Vui lòng chọn một hội nghị ở phía trên để bắt đầu phân công reviewer.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicAssignmentPage;