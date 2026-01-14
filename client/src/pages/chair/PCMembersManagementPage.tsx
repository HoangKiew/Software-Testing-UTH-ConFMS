import { useState } from 'react';
import { Add, Delete, People } from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import bgUth from '../../assets/bg_uth.svg';
import { useParams } from 'react-router-dom';
import {
    useInviteReviewerMutation,
    useGetAcceptedReviewersQuery,
    useRemoveInvitationMutation,
} from '../../redux/api/invitationsApi';

interface AcceptedReviewer {
    invitationId: string;
    userId: number;
    acceptedAt: string;
    topics: string[];
}

const PCMembersManagementPage = () => {
    const { id: conferenceId } = useParams<{ id: string }>();
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [userIdInput, setUserIdInput] = useState<string>(''); // input dạng string để dễ validate
    const [inputError, setInputError] = useState<string | null>(null);

    // Debug
    console.log('Token hiện tại:', localStorage.getItem('token') || localStorage.getItem('accessToken'));

    const {
        data: acceptedReviewers = [],
        isLoading: isLoadingAccepted,
        error: acceptedError,
        refetch: refetchAccepted,
    } = useGetAcceptedReviewersQuery(conferenceId!, { skip: !conferenceId });

    const [inviteReviewer, { isLoading: isInviting }] = useInviteReviewerMutation();
    const [removeInvitation, { isLoading: isRemoving }] = useRemoveInvitationMutation();

    const handleInvite = async () => {
        const userId = Number(userIdInput.trim());

        if (!conferenceId || isNaN(userId) || userId <= 0) {
            setInputError('Vui lòng nhập ID reviewer hợp lệ (số nguyên dương)!');
            return;
        }

        if (!window.confirm(`Gửi lời mời cho reviewer ID ${userId}?`)) return;

        try {
            await inviteReviewer({ conferenceId, userId }).unwrap();
            alert('Đã gửi lời mời thành công!');
            setShowInviteForm(false);
            setUserIdInput('');
            setInputError(null);
        } catch (err: any) {
            const msg = err.data?.message || 'Lỗi không xác định';
            alert(`Gửi lời mời thất bại: ${msg}`);
            if (err.status === 401) {
                alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                localStorage.clear();
                window.location.href = '/login';
            }
        }
    };

    const handleRemove = async (invitationId: string) => {
        if (!window.confirm('Xác nhận thu hồi lời mời này?')) return;
        try {
            await removeInvitation(invitationId).unwrap();
            alert('Đã thu hồi lời mời thành công!');
            refetchAccepted();
        } catch (err: any) {
            const msg = err.data?.message || 'Lỗi';
            alert(`Thu hồi thất bại: ${msg}`);
            if (err.status === 401) {
                alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                localStorage.clear();
                window.location.href = '/login';
            }
        }
    };

    if (isLoadingAccepted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <CircularProgress />
                <span className="ml-3">Đang tải danh sách...</span>
            </div>
        );
    }

    if (acceptedError) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600 font-medium">
                Lỗi tải danh sách: {JSON.stringify(acceptedError)}
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gray-50 py-8 px-4"
            style={{
                backgroundImage: `url(${bgUth})`,
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <People className="w-8 h-8 text-[#008689] mr-3" />
                            <h1 className="text-3xl font-bold text-gray-900">Quản lý Program Committee</h1>
                        </div>
                        <button
                            onClick={() => setShowInviteForm(!showInviteForm)}
                            className="flex items-center px-6 py-3 bg-[#008689] text-white rounded-lg hover:bg-[#006666] transition-colors shadow-sm"
                        >
                            <Add className="mr-2" /> Mời Reviewer
                        </button>
                    </div>
                </div>

                {/* Form mời reviewer - nhập ID trực tiếp */}
                {showInviteForm && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Mời reviewer tham gia</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nhập ID của reviewer (số nguyên)
                            </label>
                            <input
                                type="number"
                                value={userIdInput}
                                onChange={(e) => {
                                    setUserIdInput(e.target.value);
                                    setInputError(null);
                                }}
                                placeholder="Ví dụ: 4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent outline-none"
                                min="1"
                            />
                            {inputError && <p className="text-red-600 text-sm mt-1">{inputError}</p>}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowInviteForm(false);
                                    setUserIdInput('');
                                    setInputError(null);
                                }}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={isInviting}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={isInviting || !userIdInput.trim() || Number(userIdInput) <= 0}
                                className={`flex-1 py-3 rounded-lg text-white font-medium transition-colors ${!isInviting && userIdInput.trim() && Number(userIdInput) > 0
                                        ? 'bg-[#008689] hover:bg-[#006666]'
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isInviting ? 'Đang gửi...' : 'Gửi lời mời'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Danh sách đã chấp nhận */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">
                        Danh sách đã chấp nhận ({acceptedReviewers.length})
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Reviewer</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Chuyên môn (Topics)</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Thời gian chấp nhận</th>
                                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {acceptedReviewers.length > 0 ? (
                                    acceptedReviewers.map((member) => {
                                        const acceptedDate = member.acceptedAt ? new Date(member.acceptedAt) : null;
                                        const formattedDate =
                                            acceptedDate && !isNaN(acceptedDate.getTime())
                                                ? acceptedDate.toLocaleString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                                : 'Chưa xác định';

                                        return (
                                            <tr key={member.invitationId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    Reviewer ID: {member.userId}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {member.topics?.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {member.topics.map((topic, tIdx) => (
                                                                <span
                                                                    key={`${topic}-${tIdx}`}
                                                                    className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                                                                >
                                                                    {topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic">Chưa cập nhật</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{formattedDate}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleRemove(member.invitationId)}
                                                        disabled={isRemoving}
                                                        className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-colors"
                                                        title="Thu hồi lời mời"
                                                    >
                                                        <Delete className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 text-gray-500 italic">
                                            Chưa có reviewer nào chấp nhận lời mời
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PCMembersManagementPage;