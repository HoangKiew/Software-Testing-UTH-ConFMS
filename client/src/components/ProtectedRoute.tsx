// import { Navigate, useLocation } from 'react-router-dom';
// import { tokenUtils } from '../utils/token';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // TEMPORARY: Disable authentication for UI development
  // TODO: Re-enable when backend is ready and authentication is needed

  // const location = useLocation();
  // const isAuthenticated = tokenUtils.hasToken();

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;


