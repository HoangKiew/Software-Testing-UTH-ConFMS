import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, Save, Cancel, Delete } from '@mui/icons-material';
import { 
    useGetUserByIdQuery, 
    useUpdateUserRolesMutation, 
    useDeleteUserMutation 
} from '../../redux/api/usersApi';
import { showToast } from '../../utils/toast.ts';
import CircularProgress from '@mui/material/CircularProgress';

const EditUserPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const userId = Number(id);

    const { data: userData, isLoading, error } = useGetUserByIdQuery(userId);
    const [updateUserRoles, { isLoading: isUpdating }] = useUpdateUserRolesMutation();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'AUTHOR' as 'ADMIN' | 'CHAIR' | 'AUTHOR' | 'REVIEWER' | 'PC_MEMBER',
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const availableRoles: Array<'ADMIN' | 'CHAIR' | 'REVIEWER' | 'AUTHOR' | 'PC_MEMBER'> = [
        'ADMIN', 
        'CHAIR', 
        'REVIEWER', 
        'AUTHOR',
        'PC_MEMBER'
    ];

    const roleDescriptions = {
        ADMIN: 'Quản trị viên hệ thống',
        CHAIR: 'Chủ tịch hội nghị',
        REVIEWER: 'Phản biện viên',
        AUTHOR: 'Tác giả',
        PC_MEMBER: 'Thành viên Ban Chương trình'
    };

    // Load user data from API
    useEffect(() => {
        if (userData?.data) {
            const user = userData.data;
            const userRole = Array.isArray(user.roles) && user.roles.length > 0
                ? user.roles[0]
                : 'AUTHOR';

            setFormData({
                name: user.fullName || '',
                email: user.email || '',
                role: userRole as typeof formData.role,
            });
        }
    }, [userData]);

    const handleRoleChange = (role: typeof formData.role) => {
        setFormData((prev) => ({ ...prev, role }));
        if (errors.role) {
            setErrors((prev) => ({ ...prev, role: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await updateUserRoles({
                userId,
                data: { role: formData.role }
            }).unwrap();

            showToast.success('Cập nhật vai trò người dùng thành công!');
            navigate('/admin/users');
        } catch (err: any) {
            const errorMessage = err?.data?.message || 'Có lỗi xảy ra khi cập nhật vai trò';
            showToast.error(errorMessage);
            setErrors({ general: errorMessage });
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
            try {
                await deleteUser(userId).unwrap();
                showToast.success('Xóa người dùng thành công!');
                navigate('/admin/users');
            } catch (err: any) {
                const errorMessage = err?.data?.message || 'Có lỗi xảy ra khi xóa người dùng';
                showToast.error(errorMessage);
            }
        }
    };

    const handleCancel = () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) {
            navigate('/admin/users');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <CircularProgress size={40} />
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">Không thể tải thông tin người dùng</p>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="mt-4 px-4 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666]"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <Link
                        to="/admin/users"
                        className="inline-flex items-center text-[#008689] hover:text-[#006666] mb-4"
                    >
                        <ArrowBack className="w-5 h-5 mr-2" />
                        Quay lại danh sách
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Chỉnh sửa người dùng #{id}
                            </h1>
                            <p className="text-gray-600">
                                Cập nhật thông tin người dùng
                            </p>
                        </div>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isDeleting ? (
                                <>
                                    <CircularProgress size={16} style={{ color: 'white' }} className="mr-2" />
                                    Đang xóa...
                                </>
                            ) : (
                                <>
                                    <Delete className="w-5 h-5 mr-2" />
                                    Xóa người dùng
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            Thông tin cơ bản
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Tên và email không thể chỉnh sửa. Chỉ có thể cập nhật vai trò.
                        </p>

                        <div className="space-y-6">
                            {/* Name - Readonly */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ và tên
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                                />
                            </div>

                            {/* Email - Readonly */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* General Error */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-600 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* Roles */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Vai trò <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Chọn một vai trò cho người dùng
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableRoles.map((role) => (
                                <div
                                    key={role}
                                    onClick={() => handleRoleChange(role)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                        formData.role === role
                                            ? 'border-[#008689] bg-[#e6f7f7]'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name="role"
                                            checked={formData.role === role}
                                            onChange={() => handleRoleChange(role)}
                                            className="w-4 h-4 text-[#008689] border-gray-300 focus:ring-[#008689]"
                                        />
                                        <label className="ml-3 text-sm font-medium text-gray-900 cursor-pointer">
                                            {role}
                                        </label>
                                    </div>
                                    <p className="ml-7 text-xs text-gray-600 mt-1">
                                        {roleDescriptions[role]}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {errors.role && (
                            <p className="mt-2 text-sm text-red-500">{errors.role}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isUpdating}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Cancel className="w-5 h-5 mr-2" />
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? (
                                <>
                                    <CircularProgress size={20} className="mr-2" style={{ color: 'white' }} />
                                    Đang cập nhật...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserPage;
