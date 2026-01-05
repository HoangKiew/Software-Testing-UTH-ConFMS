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
import CreateConferencePage from '../pages/chair/CreateConferencePage.tsx';
import ConferenceManagementPage from '../pages/chair/ConferenceManagementPage.tsx';
import PaperAssignmentPage from '../pages/chair/PaperAssignmentPage.tsx';
import DecisionMakingPage from '../pages/chair/DecisionMakingPage.tsx';
import ReviewProgressPage from '../pages/chair/ReviewProgressPage.tsx';
import ConferenceDetailPageChair from '../pages/chair/ConferenceDetailPageChair.tsx';
import PCMembersManagementPage from '../pages/chair/PCMembersManagementPage.tsx';
import EditConferencePage from '../pages/chair/EditConferencePage.tsx';

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
      {
        path: 'chair/conferences/create',
        element: <CreateConferencePage />,
      },
      {
        path: 'chair/conferences',
        element: <ConferenceManagementPage />,
      },
      {
        path: 'chair/conferences/:id',
        element: <ConferenceDetailPageChair />,
      },
      {
        path: 'chair/assignments',
        element: <PaperAssignmentPage />,
      },
      {
        path: 'chair/decisions',
        element: <DecisionMakingPage />,
      },
      {
        path: 'chair/progress',
        element: <ReviewProgressPage />,
      },
      {
        path: 'chair/conferences/:id/pc-members',
        element: <PCMembersManagementPage />,
      },
      {
        path: 'chair/conferences/:id/edit',
        element: <EditConferencePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default appRouter;