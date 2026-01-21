import { createBrowserRouter, Navigate } from 'react-router-dom';
import LayoutApp from '../layouts/LayoutApp';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProtectedRoute from '../components/ProtectedRoute';
import ActivateAccount from '../pages/auth/ActivateAccount';
import AccountManagementPage from '../pages/admin/account/AccountManagementPage';
import ConferenceSetupPage from '../pages/admin/conference/ConferenceSetupPage';
import TrackManagementPage from '../pages/admin/tracks/TrackManagementPage';
import SubmissionsPage from '../pages/admin/submission/SubmissionsPage';
import PCManagementPage from '../pages/admin/pc-management/PCManagementPage';
import AssignmentsPage from '../pages/admin/review/AssignmentsPage';
import CameraReadyPage from '../pages/admin/camera-ready/CameraReadyPage';
import ReportsPage from '../pages/admin/report/ReportsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import ChangePasswordPage from '../pages/profile/ChangePasswordPage';
import LayoutAppStudent from '../layouts/LayoutAppStudent';
import ContactStudent from '../components/ContactStudent';
import Competition from '../components/Competition';
import CompetitionWithTabs from '../components/CompetitionWithTabs';
import StudentSubmissionLanding from '../pages/student/StudentSubmissionLanding';
import StudentSubmitForm from '../pages/student/StudentSubmitForm';
import StudentSubmissionDetail from '../pages/student/StudentSubmissionDetail';
import ReviewerDashboard from '../pages/reviewer/ReviewerDashboard';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import RejectedPage from '../pages/admin/rejected/RejectedPage';

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
    element: <ActivateAccount />,
  },
  {
    path: 'profile',
    element: <ProfilePage />,
  },
  {
    path: 'change-password',
    element: <ChangePasswordPage />,
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
        element: <ConferenceSetupPage />,
      },
      {
        path: 'conference-setup',
        element: <ConferenceSetupPage />,
      },
      {
        path: 'submissions',
        element: <SubmissionsPage />,
      },
      {
        path: 'pc-management',
        element: <PCManagementPage />,
      },
      {
        path: 'assignments',
        element: <AssignmentsPage />,
      },
      {
        path: 'rejected-submissions',
        element: <RejectedPage />,
      },
      {
        path: 'camera-ready',
        element: <CameraReadyPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'account-management',
        element: <AccountManagementPage />,
      },
      {
        path: 'tracks',
        element: <TrackManagementPage />,
      },
    ],
  },
  {
    path: '/student',
    element: (
      <RoleProtectedRoute allowedRoles={['AUTHOR', 'ADMIN', 'CHAIR']}>
        <LayoutAppStudent />
      </RoleProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StudentSubmissionLanding />,
      },
      {
        path: 'submit',
        element: <StudentSubmitForm />,
      },
      {
        path: 'submission/:id',
        element: <StudentSubmissionDetail />,
      },
    ],
  },
  {
    path: '/reviewer',
    element: (
      <RoleProtectedRoute allowedRoles={['REVIEWER']}>
        <LayoutAppStudent />
      </RoleProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ReviewerDashboard />,
      },
    ],
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <LayoutAppStudent />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <>
            <CompetitionWithTabs />
            <ContactStudent />
          </>
        ),
      },
      {
        path: 'publicconference',
        element: <Competition />,
      },
      {
        path: 'contact',
        element: <ContactStudent />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default appRouter;
