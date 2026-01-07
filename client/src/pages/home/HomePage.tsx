import { useState } from 'react';
import AuthorDashboard from './AuthorDashboard';
import ChairDashboard from './ChairDashboard';
import AdminDashboard from './AdminDashboard';

type UserRole = 'AUTHOR' | 'CHAIR' | 'REVIEWER' | 'ADMIN';

const HomePage = () => {
    // Mock role - will be replaced with real auth data later
    const [currentRole, setCurrentRole] = useState<UserRole>('AUTHOR');

    // Render dashboard based on role
    const renderDashboard = () => {
        switch (currentRole) {
            case 'AUTHOR':
                return <AuthorDashboard />;
            case 'CHAIR':
                return <ChairDashboard />;
            case 'REVIEWER':
                // TODO: Create ReviewerDashboard
                return <AuthorDashboard />;
            case 'ADMIN':
                return <AdminDashboard />;
            default:
                return <AuthorDashboard />;
        }
    };

    return (
        <div>
            {/* Temporary Role Switcher - Remove when auth is enabled */}
            <div className="bg-yellow-50 border-b border-yellow-200 py-3 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-yellow-800">
                            🔧 Testing Mode - Role Switcher:
                        </span>
                        <select
                            value={currentRole}
                            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                            className="px-4 py-2 border border-yellow-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#008689]"
                        >
                            <option value="AUTHOR">Author</option>
                            <option value="CHAIR">Chair</option>
                            <option value="REVIEWER">Reviewer</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <span className="text-xs text-yellow-700">
                        This will be removed when authentication is enabled
                    </span>
                </div>
            </div>

            {/* Render appropriate dashboard */}
            {renderDashboard()}
        </div>
    );
};

export default HomePage;
