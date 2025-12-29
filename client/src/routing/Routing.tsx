import { createBrowserRouter, Navigate } from 'react-router-dom';
import LayoutApp from '../layouts/LayoutApp';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProtectedRoute from '../components/ProtectedRoute';
import ActivateAccount from '../pages/auth/ActivateAccount';

const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/activate-account',
    element : <ActivateAccount/>
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LayoutApp />
      </ProtectedRoute>
    ),
    children: [
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default appRouter;