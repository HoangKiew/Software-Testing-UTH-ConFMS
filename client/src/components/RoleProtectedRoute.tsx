import { Navigate, useLocation } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import { useEffect, useState } from 'react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const location = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [hasShownToast, setHasShownToast] = useState(false);

  // Check if user has required role
  const hasRequiredRole = user && allowedRoles.some(role => user.roles?.includes(role));

  useEffect(() => {
    if (!isLoading && user && !hasRequiredRole && !hasShownToast) {
      showToast.error('Bạn không đủ thẩm quyền để truy cập trang này');
      setHasShownToast(true);
    }
  }, [user, isLoading, hasRequiredRole, hasShownToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress disableShrink />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress disableShrink />
      </div>
    );
  }

  if (!hasRequiredRole) {
    const isChairOrAdmin = user.roles?.includes('CHAIR') || user.roles?.includes('ADMIN');
    const isReviewer = user.roles?.includes('REVIEWER');
    
    if (isChairOrAdmin) {
      return <Navigate to="/reports" replace />;
    }
    if (isReviewer) {
      return <Navigate to="/reviewer" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;

