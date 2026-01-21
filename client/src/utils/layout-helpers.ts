import { useLocation } from 'react-router-dom';

/**
 * Check if current page is inside LayoutApp (admin pages)
 * LayoutApp routes: /, /dashboard, /conference-setup, /submissions, /assignments, etc.
 * These routes are children of LayoutApp component
 */
export const useIsInLayoutApp = (): boolean => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // LayoutApp routes (admin pages) - exact matches or paths starting with these routes
  const layoutAppRoutes = [
    '/dashboard',
    '/conference-setup',
    '/submissions',
    '/pc-management',
    '/assignments',
    '/camera-ready',
    '/reports',
    '/account-management',
    '/tracks',
    '/profile',
    '/change-password',
  ];

  // Root path '/' is also LayoutApp (ConferenceSetupPage)
  if (pathname === '/' || pathname === '/dashboard') {
    return true;
  }

  // Check if pathname starts with any LayoutApp route
  return layoutAppRoutes.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
};
