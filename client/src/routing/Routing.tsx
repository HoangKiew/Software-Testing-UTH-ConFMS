import { createBrowserRouter, Navigate } from 'react-router-dom';
import LayoutApp from '../layouts/LayoutApp.tsx';
import LoginPage from '../pages/auth/LoginPage.tsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.tsx';
import ProtectedRoute from '../components/ProtectedRoute.tsx';
import ActivateAccount from '../pages/auth/ActivateAccount.tsx';
import HomePage from '../pages/home/HomePage.tsx';
import SubmitPaperPage from '../pages/submission/SubmitPaperPage.tsx';
import ConferenceListPage from '../pages/conference/ConferenceListPage.tsx';
import ConferenceDetailPage from '../pages/conference/ConferenceDetailPage.tsx';
import MySubmissionsPage from '../pages/submission/MySubmissionsPage.tsx';
import SubmissionDetailPage from '../pages/submission/SubmissionDetailPage.tsx';
import EditSubmissionPage from '../pages/submission/EditSubmissionPage.tsx';
import CameraReadyUploadPage from '../pages/submission/CameraReadyUploadPage.tsx';

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
    element: <ActivateAccount />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LayoutApp />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'submission',
        element: <SubmitPaperPage />,
      },
      {
        path: 'conferences',
        element: <ConferenceListPage />,
      },
      {
        path: 'conferences/:id',
        element: <ConferenceDetailPage />,
      },
      {
        path: 'my-submissions',
        element: <MySubmissionsPage />,
      },
      {
        path: 'submissions/:id',
        element: <SubmissionDetailPage />,
      },
      {
        path: 'submissions/:id/edit',
        element: <EditSubmissionPage />,
      },
      {
        path: 'submissions/:id/camera-ready',
        element: <CameraReadyUploadPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default appRouter;