import { useState, useEffect, useMemo, MouseEvent } from 'react';
import { Search, Person, Assignment, AutoAwesome, FilterList, Delete } from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

// ── API hooks ──
import {
    useSuggestReviewersForTopicQuery,
    useAssignReviewersToTopicMutation,
    useGetAssignmentsByConferenceQuery,
    useUnassignMutation,
} from '../../redux/api/assignmentsApi';
import { useGetAcceptedReviewersQuery } from '../../redux/api/invitationsApi';
import { useGetConferencesQuery } from '../../redux/api/conferencesApi';

const TopicAssignmentPage = () => {
    const [selectedConferenceId, setSelectedConferenceId] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [topN, setTopN] = useState(5);

    const {
        data: conferences = [],
        isLoading: loadingConfs,
        isError: confError,
    } = useGetConferencesQuery({});

    useEffect(() => {
        if (conferences.length === 1 && !selectedConferenceId) {
            setSelectedConferenceId(conferences[0].id);
        }
    }, [conferences, selectedConferenceId]);

    const { data: assignments = [], refetch: refetchAssignments } = useGetAssignmentsByConferenceQuery(
        selectedConferenceId!,
        { skip: !selectedConferenceId }
    );

    const { data: acceptedReviewers = [] } = useGetAcceptedReviewersQuery(
        selectedConferenceId!,
        { skip: !selectedConferenceId }
    );

    const { data: suggestions = [] } = useSuggestReviewersForTopicQuery(
        { conferenceId: selectedConferenceId!, topic: selectedTopic || '', top: topN },
        { skip: !selectedConferenceId || !selectedTopic }
    );

    const [assignReviewers] = useAssignReviewersToTopicMutation();
    const [unassignReviewer] = useUnassignMutation(); // ← ĐỔI TÊN HOOK Ở ĐÂY

    const selectedConf = conferences.find((c: any) => c.id === selectedConferenceId);
    const topics = selectedConf?.topics?.length > 0
        ? selectedConf.topics
        : ['Artificial Intelligence', 'Cybersecurity', 'Data Science', 'IoT'];

    const handleAssign = async (reviewerId: number) => {
        if (!selectedTopic || !selectedConferenceId) return;
        try {
            await assignReviewers({
                conferenceId: selectedConferenceId,
                topic: selectedTopic,
                reviewerIds: [reviewerId],
            }).unwrap();
            alert(`Đã phân công reviewer cho topic "${selectedTopic}"`);
            refetchAssignments(); // ← Refetch để update danh sách phân công
        } catch (err: any) {
            alert('Phân công thất bại: ' + (err.data?.message || 'Lỗi hệ thống'));
        }
    };

    // Chỉ được gọi từ onClick của nút Auto-assign
    const handleAutoAssign = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!selectedTopic || !selectedConferenceId || suggestions.length === 0) return;

        // Lọc giống logic hiển thị: 
        // - cho phép nếu chưa khai báo topic nào
        // - hoặc declaredTopics có chứa selectedTopic
        const filteredSuggestions = (suggestions as any[]).filter((sug) => {
            const reviewer = (acceptedReviewers as any[]).find(
                (r) => r.userId === sug.reviewerId,
            );

            const declaredTopics: string[] =
                (Array.isArray(sug.expertise) && sug.expertise.length > 0
                    ? sug.expertise
                    : Array.isArray(reviewer?.topics)
                        ? reviewer.topics
                        : []) as string[];

            if (declaredTopics.length > 0 && selectedTopic && !declaredTopics.includes(selectedTopic)) {
                return false;
            }
            return true;
        });

        if (filteredSuggestions.length === 0) {
            alert('Không có reviewer phù hợp (topic đã khai báo không trùng với topic hội nghị).');
            return;
        }

        const topIds = filteredSuggestions.slice(0, 3).map((r: any) => r.reviewerId);

        assignReviewers({
            conferenceId: selectedConferenceId,
            topic: selectedTopic,
            reviewerIds: topIds,
        })
            .unwrap()
            .then(() => {
                alert('Đã tự động phân công top reviewers!');
                refetchAssignments();
            })
            .catch((err) => alert('Lỗi: ' + (err.data?.message || 'Không thể phân công')));
    };

    // THÊM: Hàm hủy phân công
    const handleUnassign = async (assignmentId: string) => {
        if (!window.confirm('Bạn có chắc muốn hủy phân công reviewer này?')) return;

        try {
            await unassignReviewer(assignmentId).unwrap();
            alert('Đã hủy phân công thành công!');
            refetchAssignments(); // ← Update lại danh sách phân công
        } catch (err: any) {
            alert('Hủy phân công thất bại: ' + (err.data?.message || 'Lỗi hệ thống'));
        }
    };

    const groupedAssignments = useMemo(
        () =>
            (assignments as any[]).reduce((acc: any[], assignment: any) => {
                const reviewer = (acceptedReviewers as any[]).find(
                    (r) => r.userId === assignment.reviewerId
                );

                const reviewerInfo = {
                    id: assignment.reviewerId,
                    name: reviewer?.name,
                    email: reviewer?.email,
                    assignmentId: assignment.id, // ← LƯU ID PHÂN CÔNG
                };

                const existing = acc.find((a) => a.topic === assignment.topic);
                if (existing) {
                    existing.reviewers.push(reviewerInfo);
                } else {
                    acc.push({
                        topic: assignment.topic,
                        reviewers: [reviewerInfo],
                    });
                }
                return acc;
            }, []),
        [assignments, acceptedReviewers]
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ backgroundImage: `url(${bgUth})`, backgroundSize: 'cover' }}>
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-3xl font-bold">Phân công Reviewer theo Topic</h1>
                </div>

                {/* Chọn hội nghị */}
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
                                setSelectedTopic(null);
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
                                            onClick={(e) => handleAutoAssign(e)}
                                            disabled={suggestions.length === 0}
                                            className="mb-6 flex items-center px-5 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                        >
                                            <AutoAwesome className="mr-2" /> Auto-assign top reviewers
                                        </button>

                                        <div className="space-y-4">
                                            {suggestions.length > 0 ? (
                                                suggestions.map((sug: any) => {
                                                    // Lấy thêm thông tin từ danh sách reviewer đã chấp nhận
                                                    const reviewer = (acceptedReviewers as any[]).find(
                                                        (r) => r.userId === sug.reviewerId,
                                                    );

                                                    const displayName =
                                                        sug.name ||
                                                        reviewer?.name ||
                                                        `Reviewer #${sug.reviewerId}`;
                                                    const displayEmail =
                                                        sug.email ||
                                                        reviewer?.email ||
                                                        '—';

                                                    // Topics reviewer đã khai báo cho hội nghị này
                                                    const declaredTopics: string[] =
                                                        (Array.isArray(sug.expertise) && sug.expertise.length > 0
                                                            ? sug.expertise
                                                            : Array.isArray(reviewer?.topics)
                                                                ? reviewer.topics
                                                                : []) as string[];

                                                    // LỌC: nếu đã khai báo topics nhưng KHÔNG chứa selectedTopic thì ẩn
                                                    if (
                                                        declaredTopics.length > 0 &&
                                                        selectedTopic &&
                                                        !declaredTopics.includes(selectedTopic)
                                                    ) {
                                                        return null;
                                                    }

                                                    const scorePercent =
                                                        typeof sug.score === 'number'
                                                            ? `${(sug.score * 100).toFixed(1)}%`
                                                            : '—';

                                                    return (
                                                        <div
                                                            key={sug.reviewerId}
                                                            className="border rounded-lg p-4 hover:border-[#008689] transition"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="font-medium">{displayName}</div>
                                                                    <div className="text-sm text-gray-600">
                                                                        {displayEmail}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-green-600 font-bold text-lg">
                                                                        {scorePercent}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">độ phù hợp</div>
                                                                </div>
                                                            </div>

                                                            {/* Topics reviewer đã khai báo */}
                                                            {declaredTopics.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-3">
                                                                    {declaredTopics.map((exp: string) => (
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
                                                    );
                                                })
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

                        {/* Phân công hiện tại - THÊM nút hủy */}
                        <div className="bg-white rounded-lg shadow p-6 mt-6">
                            <h2 className="text-xl font-bold mb-4">Phân công hiện tại của hội nghị</h2>
                            <div className="space-y-3">
                                {groupedAssignments.length > 0 ? (
                                    groupedAssignments.map((assign: any) => (
                                        <div key={assign.topic} className="border rounded p-4 bg-gray-50">
                                            <strong className="block mb-1">{assign.topic}</strong>
                                            <div className="text-gray-700 space-y-2">
                                                {assign.reviewers?.length > 0 ? (
                                                    assign.reviewers.map((r: any, idx: number) => (
                                                        <div
                                                            key={r.assignmentId || `${assign.topic}-${r.id}-${idx}`} // ← KEY DUY NHẤT
                                                            className="flex items-center justify-between"
                                                        >
                                                            <span>
                                                                {r.name || `Reviewer #${r.id}`} ({r.email || `ID: ${r.id}`})
                                                            </span>
                                                            <button
                                                                onClick={() => handleUnassign(r.assignmentId)} // ← TRUYỀN ĐÚNG assignmentId
                                                                className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition"
                                                                title="Hủy phân công reviewer này"
                                                            >
                                                                <Delete className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    'Chưa có reviewer nào được phân công'
                                                )}
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