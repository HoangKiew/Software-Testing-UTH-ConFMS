import { useState } from 'react';
import { Save, RestartAlt, Email, Storage, Security, Settings as SettingsIcon } from '@mui/icons-material';

const PlatformSettingsPage = () => {
    const [activeTab, setActiveTab] = useState('smtp');
    const [hasChanges, setHasChanges] = useState(false);

    // SMTP Settings
    const [smtpSettings, setSmtpSettings] = useState({
        host: 'smtp.gmail.com',
        port: '587',
        username: 'admin@uth-confms.com',
        password: '',
        fromEmail: 'noreply@uth-confms.com',
        fromName: 'UTH-ConfMS System',
        encryption: 'TLS',
    });

    // Storage Settings
    const [storageSettings, setStorageSettings] = useState({
        maxFileSize: '10',
        maxTotalStorage: '1000',
        allowedFileTypes: '.pdf,.doc,.docx,.tex,.zip',
        storageProvider: 'local',
    });

    // System Settings
    const [systemSettings, setSystemSettings] = useState({
        siteName: 'UTH-ConfMS',
        siteUrl: 'https://confms.uth.edu.vn',
        adminEmail: 'admin@uth.edu.vn',
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
        maintenanceMode: false,
    });

    // Email Quota Settings
    const [quotaSettings, setQuotaSettings] = useState({
        dailyEmailLimit: '1000',
        hourlyEmailLimit: '100',
        perUserDailyLimit: '50',
    });

    const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSmtpSettings({ ...smtpSettings, [e.target.name]: e.target.value });
        setHasChanges(true);
    };

    const handleStorageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setStorageSettings({ ...storageSettings, [e.target.name]: e.target.value });
        setHasChanges(true);
    };

    const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setSystemSettings({ ...systemSettings, [e.target.name]: value });
        setHasChanges(true);
    };

    const handleQuotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuotaSettings({ ...quotaSettings, [e.target.name]: e.target.value });
        setHasChanges(true);
    };

    const handleSave = () => {
        // TODO: Call API to save settings
        console.log('Saving settings:', {
            smtp: smtpSettings,
            storage: storageSettings,
            system: systemSettings,
            quota: quotaSettings,
        });
        alert('Cài đặt đã được lưu thành công!');
        setHasChanges(false);
    };

    const handleTestEmail = () => {
        // TODO: Call API to test email
        alert('Đang gửi email test...');
    };

    const handleReset = () => {
        if (window.confirm('Bạn có chắc chắn muốn khôi phục cài đặt mặc định?')) {
            // TODO: Reset to default settings
            setHasChanges(false);
        }
    };

    const tabs = [
        { id: 'smtp', label: 'SMTP Email', icon: Email },
        { id: 'storage', label: 'Lưu trữ', icon: Storage },
        { id: 'quota', label: 'Email Quota', icon: Security },
        { id: 'system', label: 'Hệ thống', icon: SettingsIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Cài đặt hệ thống
                    </h1>
                    <p className="text-gray-600">
                        Quản lý cấu hình SMTP, quotas, và các thiết lập nền tảng
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <nav className="space-y-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${activeTab === tab.id
                                                ? 'bg-[#008689] text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <tab.icon className="w-5 h-5 mr-3" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Save Button */}
                        {hasChanges && (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800 mb-3">
                                    Bạn có thay đổi chưa lưu
                                </p>
                                <button
                                    onClick={handleSave}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu thay đổi
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {/* SMTP Settings */}
                        {activeTab === 'smtp' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    Cài đặt SMTP Email
                                </h2>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                SMTP Host
                                            </label>
                                            <input
                                                type="text"
                                                name="host"
                                                value={smtpSettings.host}
                                                onChange={handleSmtpChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                SMTP Port
                                            </label>
                                            <input
                                                type="text"
                                                name="port"
                                                value={smtpSettings.port}
                                                onChange={handleSmtpChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={smtpSettings.username}
                                            onChange={handleSmtpChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={smtpSettings.password}
                                            onChange={handleSmtpChange}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                From Email
                                            </label>
                                            <input
                                                type="email"
                                                name="fromEmail"
                                                value={smtpSettings.fromEmail}
                                                onChange={handleSmtpChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                From Name
                                            </label>
                                            <input
                                                type="text"
                                                name="fromName"
                                                value={smtpSettings.fromName}
                                                onChange={handleSmtpChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Encryption
                                        </label>
                                        <select
                                            name="encryption"
                                            value={smtpSettings.encryption}
                                            onChange={handleSmtpChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        >
                                            <option value="TLS">TLS</option>
                                            <option value="SSL">SSL</option>
                                            <option value="NONE">None</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <button
                                            onClick={handleTestEmail}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                                        >
                                            <Email className="w-4 h-4 mr-2" />
                                            Gửi email test
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Storage Settings */}
                        {activeTab === 'storage' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    Cài đặt lưu trữ
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kích thước file tối đa (MB)
                                        </label>
                                        <input
                                            type="number"
                                            name="maxFileSize"
                                            value={storageSettings.maxFileSize}
                                            onChange={handleStorageChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Kích thước tối đa cho mỗi file upload
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tổng dung lượng lưu trữ (GB)
                                        </label>
                                        <input
                                            type="number"
                                            name="maxTotalStorage"
                                            value={storageSettings.maxTotalStorage}
                                            onChange={handleStorageChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Tổng dung lượng lưu trữ cho toàn hệ thống
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Loại file được phép
                                        </label>
                                        <input
                                            type="text"
                                            name="allowedFileTypes"
                                            value={storageSettings.allowedFileTypes}
                                            onChange={handleStorageChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Các định dạng file được phép upload (phân cách bằng dấu phẩy)
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Storage Provider
                                        </label>
                                        <select
                                            name="storageProvider"
                                            value={storageSettings.storageProvider}
                                            onChange={handleStorageChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        >
                                            <option value="local">Local Storage</option>
                                            <option value="s3">Amazon S3</option>
                                            <option value="gcs">Google Cloud Storage</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Quota Settings */}
                        {activeTab === 'quota' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    Cài đặt Email Quota
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Giới hạn email hàng ngày
                                        </label>
                                        <input
                                            type="number"
                                            name="dailyEmailLimit"
                                            value={quotaSettings.dailyEmailLimit}
                                            onChange={handleQuotaChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Số lượng email tối đa hệ thống có thể gửi mỗi ngày
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Giới hạn email mỗi giờ
                                        </label>
                                        <input
                                            type="number"
                                            name="hourlyEmailLimit"
                                            value={quotaSettings.hourlyEmailLimit}
                                            onChange={handleQuotaChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Số lượng email tối đa hệ thống có thể gửi mỗi giờ
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Giới hạn email mỗi user/ngày
                                        </label>
                                        <input
                                            type="number"
                                            name="perUserDailyLimit"
                                            value={quotaSettings.perUserDailyLimit}
                                            onChange={handleQuotaChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Số lượng email tối đa mỗi user có thể gửi mỗi ngày
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System Settings */}
                        {activeTab === 'system' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    Cài đặt hệ thống
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tên website
                                        </label>
                                        <input
                                            type="text"
                                            name="siteName"
                                            value={systemSettings.siteName}
                                            onChange={handleSystemChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            URL website
                                        </label>
                                        <input
                                            type="url"
                                            name="siteUrl"
                                            value={systemSettings.siteUrl}
                                            onChange={handleSystemChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email admin
                                        </label>
                                        <input
                                            type="email"
                                            name="adminEmail"
                                            value={systemSettings.adminEmail}
                                            onChange={handleSystemChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Timezone
                                            </label>
                                            <select
                                                name="timezone"
                                                value={systemSettings.timezone}
                                                onChange={handleSystemChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            >
                                                <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</option>
                                                <option value="UTC">UTC</option>
                                                <option value="America/New_York">America/New York</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ngôn ngữ
                                            </label>
                                            <select
                                                name="language"
                                                value={systemSettings.language}
                                                onChange={handleSystemChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                                            >
                                                <option value="vi">Tiếng Việt</option>
                                                <option value="en">English</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="maintenanceMode"
                                                checked={systemSettings.maintenanceMode}
                                                onChange={handleSystemChange}
                                                className="w-4 h-4 text-[#008689] border-gray-300 rounded focus:ring-[#008689]"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-900">
                                                Chế độ bảo trì
                                            </span>
                                        </label>
                                        <p className="ml-7 mt-1 text-sm text-gray-500">
                                            Khi bật, chỉ admin mới có thể truy cập hệ thống
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 mt-6">
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                <RestartAlt className="w-5 h-5 mr-2" />
                                Khôi phục mặc định
                            </button>
                            <button
                                onClick={handleSave}
                                className="inline-flex items-center px-6 py-3 bg-[#008689] hover:bg-[#006666] text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Lưu cài đặt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformSettingsPage;
