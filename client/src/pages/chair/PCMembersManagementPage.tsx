import { useState } from 'react';
import {
    Add,
    Edit,
    Delete,
    People
} from '@mui/icons-material';
import bgUth from '../../assets/bg_uth.svg';

interface PCMember {
    id: number;
    name: string;
    email: string;
    role: string;
    affiliation?: string;
    expertise?: string[];
}

const PCMembersManagementPage = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMember, setEditingMember] = useState<PCMember | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: ''
    });

    // Mock data
    const [pcMembers, setPcMembers] = useState<PCMember[]>([
        {
            id: 1,
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@gmail.com',
            role: 'Chủ tịch',
            affiliation: 'VNU-HCM',
            expertise: ['AI', 'Machine Learning']
        },
        {
            id: 2,
            name: 'Nguyễn Văn B',
            email: 'hoangvanb@gmail.com',
            role: 'Phản biện viên',
            affiliation: 'HCMUT',
            expertise: ['Software Engineering']
        },
        {
            id: 3,
            name: 'Phạm Văn Việt',
            email: 'vanviet@gmail.com',
            role: 'Phản biện viên',
            affiliation: 'UIT',
            expertise: ['Data Science']
        },
        {
            id: 4,
            name: 'Thu Uyên',
            email: 'hoangthu@gmail.com',
            role: 'Phản biện viên',
            affiliation: 'HCMUS',
            expertise: ['Cybersecurity']
        },
        {
            id: 5,
            name: 'Nguyễn Trần Huyền',
            email: 'nguyentranhuyen@gmail.com',
            role: 'Phản biện viên',
            affiliation: 'VNU-HCM',
            expertise: ['Cloud Computing']
        }
    ]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddMember = () => {
        if (!formData.name || !formData.email || !formData.role) {
            alert('⚠️ Vui lòng điền đầy đủ thông tin!');
            return;
        }

        const newMember: PCMember = {
            id: pcMembers.length + 1,
            name: formData.name,
            email: formData.email,
            role: formData.role
        };

        setPcMembers([...pcMembers, newMember]);
        setFormData({ name: '', email: '', role: '' });
        setShowAddForm(false);
        alert('✅ Đã thêm thành viên mới thành công!');
    };

    const handleEditMember = (member: PCMember) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            role: member.role
        });
        setShowAddForm(true);
    };

    const handleUpdateMember = () => {
        if (!editingMember) return;

        setPcMembers(pcMembers.map(m =>
            m.id === editingMember.id
                ? { ...m, name: formData.name, email: formData.email, role: formData.role }
                : m
        ));

        setFormData({ name: '', email: '', role: '' });
        setEditingMember(null);
        setShowAddForm(false);
        alert('✅ Đã cập nhật thông tin thành viên!');
    };

    const handleDeleteMember = (memberId: number) => {
        const member = pcMembers.find(m => m.id === memberId);
        if (!member) return;

        if (window.confirm(`Xác nhận xóa thành viên "${member.name}"?`)) {
            setPcMembers(pcMembers.filter(m => m.id !== memberId));
            alert('✅ Đã xóa thành viên!');
        }
    };

    const handleCancel = () => {
        setFormData({ name: '', email: '', role: '' });
        setEditingMember(null);
        setShowAddForm(false);
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
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center mb-2">
                        <People className="w-8 h-8 text-[#008689] mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">
                            Quản lý ban trường trình (PC)
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Quản lý danh sách Program Committee Members cho hội nghị
                    </p>
                </div>

                {/* Add Member Form */}
                {!showAddForm && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full flex items-center justify-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#008689] hover:text-[#008689] hover:bg-[#e6f7f7] transition-all"
                        >
                            <Add className="w-5 h-5 mr-2" />
                            Thêm thành viên mới
                        </button>
                    </div>
                )}

                {showAddForm && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
                        </h2>

                        <div className="space-y-4">
                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ và tên<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Họ tên"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>

                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                />
                            </div>

                            {/* Role Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn vai trò<span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008689] focus:border-transparent appearance-none"
                                >
                                    <option value="">Vai trò</option>
                                    <option value="Chủ tịch">Chủ tịch</option>
                                    <option value="Phó chủ tịch">Phó chủ tịch</option>
                                    <option value="Phản biện viên">Phản biện viên</option>
                                    <option value="Thư ký">Thư ký</option>
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={editingMember ? handleUpdateMember : handleAddMember}
                                    className="flex-1 px-6 py-2 bg-[#008689] hover:bg-[#006666] text-white font-semibold rounded-lg transition-colors"
                                >
                                    {editingMember ? 'Cập nhật' : 'Thêm thành viên'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PC Members List */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Danh sách PC
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                        Họ và tên
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                                        Vai trò
                                    </th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {pcMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {member.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {member.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {member.role}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditMember(member)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMember(member.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Delete className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {pcMembers.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                Chưa có PC Member nào. Nhấn "Thêm thành viên mới" để bắt đầu.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PCMembersManagementPage;
