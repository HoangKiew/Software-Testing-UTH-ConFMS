import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, Save, Cancel, Delete } from '@mui/icons-material';

const EditUserPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        roles: [] as string[],
        status: 'Active',
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);

    const availableRoles = ['ADMIN', 'CHAIR', 'REVIEWER', 'AUTHOR'];

    // Mock data - replace with API call
    useEffect(() => {
        // TODO: Fetch user data from API
        const mockUser = {
            id: parseInt(id || '0'),
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com',
            roles: ['ADMIN', 'CHAIR'],
            status: 'Active',
        };

        setFormData({
            name: mockUser.name,
            email: mockUser.email,
            roles: mockUser.roles,
            status: mockUser.status,
        });
        setLoading(false);
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleRoleToggle = (role: string) => {
        setFormData((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role],
        }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên không được để trống';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email không được để trống';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (formData.roles.length === 0) {
            newErrors.roles = 'Vui lòng chọn ít nhất một vai trò';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // TODO: Call API to update user
        console.log('Update user:', { id, ...formData });

        // Show success message and redirect
        alert('Cập nhật người dùng thành công!');
        navigate('/admin/users');
    };

    const handleDelete = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
            // TODO: Call API to delete user
            console.log('Delete user:', id);
            alert('Xóa người dùng thành công!');
            navigate('/admin/users');
        }
    };

    const handleCancel = () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) {
            navigate('/admin/users');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Đang tải...</p>
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
                            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                        >
                            <Delete className="w-5 h-5 mr-2" />
                            Xóa người dùng
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

                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent`}
                                    placeholder="Nhập họ và tên"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent`}
                                    placeholder="example@email.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Roles */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Vai trò <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Chọn một hoặc nhiều vai trò cho người dùng
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableRoles.map((role) => (
                                <div
                                    key={role}
                                    onClick={() => handleRoleToggle(role)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${formData.roles.includes(role)
                                            ? 'border-[#008689] bg-[#e6f7f7]'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.roles.includes(role)}
                                            onChange={() => handleRoleToggle(role)}
                                            className="w-4 h-4 text-[#008689] border-gray-300 rounded focus:ring-[#008689]"
                                        />
                                        <label className="ml-3 text-sm font-medium text-gray-900 cursor-pointer">
                                            {role}
                                        </label>
                                    </div>
                                    <p className="ml-7 text-xs text-gray-600 mt-1">
                                        {role === 'ADMIN' && 'Quản trị viên hệ thống'}
                                        {role === 'CHAIR' && 'Chủ tịch hội nghị'}
                                        {role === 'REVIEWER' && 'Phản biện viên'}
                                        {role === 'AUTHOR' && 'Tác giả'}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {errors.roles && (
                            <p className="mt-2 text-sm text-red-500">{errors.roles}</p>
                        )}
                    </div>

                    {/* Status */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Trạng thái
                        </h2>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="Active"
                                    checked={formData.status === 'Active'}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-[#008689] border-gray-300 focus:ring-[#008689]"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    Đang hoạt động
                                </span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="status"
                                    value="Inactive"
                                    checked={formData.status === 'Inactive'}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-[#008689] border-gray-300 focus:ring-[#008689]"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                    Không hoạt động
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                            <Cancel className="w-5 h-5 mr-2" />
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserPage;
