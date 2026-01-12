import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthorDashboard from './AuthorDashboard';
import ChairDashboard from './ChairDashboard';
import AdminDashboard from './AdminDashboard';

type UserRole = 'AUTHOR' | 'CHAIR' | 'REVIEWER' | 'ADMIN';

const HomePage = () => {
    // Mock role - will be replaced with real auth data when logged in
    const [currentRole, setCurrentRole] = useState<UserRole>('AUTHOR');
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        const rolesInput = user.roles;
        let roles: string[] = [];
        if (Array.isArray(rolesInput)) {
            roles = rolesInput.map((r) => (typeof r === 'string' ? r : r?.name ?? r?.role ?? r?.value)).filter(Boolean).map((s) => s!.toString().toUpperCase());
        } else if (typeof rolesInput === 'string') {
            roles = [rolesInput.toUpperCase()];
        }

        if (roles.includes('ADMIN')) setCurrentRole('ADMIN');
        else if (roles.includes('CHAIR')) setCurrentRole('CHAIR');
        else if (roles.includes('REVIEWER')) setCurrentRole('REVIEWER');
        else setCurrentRole('AUTHOR');
    }, [user]);

    // Render dashboard based on role
    const renderDashboard = () => {
        switch (currentRole) {
            case 'AUTHOR':
                return <AuthorDashboard />;
            case 'CHAIR':
                return <ChairDashboard currentRole={currentRole} />;
            case 'REVIEWER':
                // TODO: Create ReviewerDashboard
                return <AuthorDashboard />;
            case 'ADMIN':
                // For admin we want the same UI as Chair but admin will have extra user management links
                return <ChairDashboard currentRole={currentRole} />;
            default:
                return <AuthorDashboard />;
        }
    };

    return (
        <div>
            {/* Render appropriate dashboard */}
            {renderDashboard()}
        </div>
    );
};

export default HomePage;
