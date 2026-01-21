import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { tokenUtils } from '../utils/token';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = tokenUtils.hasToken();

  // Listen for auth:logout event to navigate without reload
  useEffect(() => {
    const handleLogout = () => {
      navigate('/login', { replace: true });
    };
    
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;






