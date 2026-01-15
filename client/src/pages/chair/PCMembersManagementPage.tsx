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
import { useSearchReviewersQuery } from '../../redux/api/usersApi';

interface AcceptedReviewer {
    invitationId: string;
    userId: number;
    acceptedAt: string;
    topics: string[];
    name?: string;
    email?: string;
}

const PCMembersManagementPage = () => {
    const { id: conferenceId } = useParams<{ id: string }>();
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Debug token
    console.log('Token hiện tại:', localStorage.getItem('token') || localStorage.getItem('accessToken'));

    const {
        data: acceptedReviewers = [],
        isLoading: isLoadingAccepted,
        error: acceptedError,
        refetch: refetchAccepted,
    } = useGetAcceptedReviewersQuery(conferenceId!, { skip: !conferenceId });

    const [inviteReviewer, { isLoading: isInviting }] = useInviteReviewerMutation();
    const [removeInvitation, { isLoading: isRemoving }] = useRemoveInvitationMutation();

    const {
        data: reviewers = [],
        isLoading: isLoadingReviewers,
        error: reviewersError,
    } = useSearchReviewersQuery(
        { q: searchTerm || undefined, page: 1, limit: 50 },
        { skip: !showInviteForm }
    );

    const invitedIds = new Set(acceptedReviewers.map((r) => r.userId));

    const handleInvite = async (userId: number, displayName?: string, email?: string) => {
        if (!conferenceId) {
            alert('Thiếu ID hội nghị');
            return;
        }

        if (!email) {
            alert('Không tìm thấy email của reviewer này. Không thể gửi lời mời.');
            return;
        }

        if (!window.confirm(`Gửi lời mời cho reviewer ${displayName || `ID ${userId}`} (${email})?`)) return;

        try {
            await inviteReviewer({
                conferenceId,
                userId,
                email  // ← THÊM: gửi kèm email vào body API
            }).unwrap();

            alert('Đã gửi lời mời thành công!');
            refetchAccepted();
            // Nếu muốn đóng form sau khi mời thành công, uncomment dòng dưới
            // setShowInviteForm(false);
        } catch (err: any) {
            const msg = err?.data?.message || 'Lỗi không xác định';
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

                {/* Form mời reviewer */}
                {showInviteForm && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Mời reviewer tham gia</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tìm reviewer theo tên hoặc email
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nhập tên hoặc email reviewer..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Chỉ hiển thị các tài khoản đã có role REVIEWER trong hệ thống.
                            </p>
                        </div>

                        {isLoadingReviewers ? (
                            <div className="flex items-center justify-center py-6 text-gray-600">
                                <CircularProgress size={20} />
                                <span className="ml-3">Đang tìm reviewer...</span>
                            </div>
                        ) : reviewersError ? (
                            <div className="text-red-600 text-sm py-4">
                                Không thể tải danh sách reviewer. Vui lòng thử lại sau.
                            </div>
                        ) : reviewers.length === 0 ? (
                            <div className="text-gray-500 italic py-4">
                                Không tìm thấy reviewer nào phù hợp với từ khóa.
                            </div>
                        ) : (
                            <div className="overflow-x-auto max-h-96 border border-gray-100 rounded-lg">
                                <table className="w-full min-w-max text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium text-gray-700">ID</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-700">Tên</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                                            <th className="px-4 py-2 text-left font-medium text-gray-700">Vai trò</th>
                                            <th className="px-4 py-2 text-center font-medium text-gray-700">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {reviewers.map((u: any) => {
                                            const name = u.fullName || u.name || `User #${u.id}`;
                                            const email = u.email || '';
                                            const roles: string[] = Array.isArray(u.roles)
                                                ? u.roles.map((r: any) =>
                                                    typeof r === 'string' ? r : r?.name || r?.role,
                                                )
                                                : u.role
                                                    ? [u.role]
                                                    : [];
                                            const roleLabel = roles.join(', ') || 'REVIEWER';
                                            const alreadyInPc = invitedIds.has(u.id);

                                            return (
                                                <tr key={u.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-900">#{u.id}</td>
                                                    <td className="px-4 py-2 text-gray-900">{name}</td>
                                                    <td className="px-4 py-2 text-gray-700">{email || 'Không có email'}</td>
                                                    <td className="px-4 py-2 text-gray-700">
                                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                            {roleLabel}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => handleInvite(u.id, name, email)}
                                                            disabled={isInviting || alreadyInPc || !email}  // ← Disable nếu không có email
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${alreadyInPc || !email
                                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-[#008689] text-white hover:bg-[#006666]'
                                                                }`}
                                                            title={!email ? 'Không có email để gửi lời mời' : ''}
                                                        >
                                                            {alreadyInPc ? 'Đã trong PC' : !email ? 'Không có email' : 'Mời'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
                                                    <div className="font-semibold">
                                                        {member.name || `Reviewer #${member.userId}`}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {member.email || `ID: ${member.userId}`}
                                                    </div>
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