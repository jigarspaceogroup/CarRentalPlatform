import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function GuestGuard() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const location = useLocation();
  const hasHydrated = useRef(false);

  // Hydrate auth state on mount
  useEffect(() => {
    if (!hasHydrated.current) {
      hydrate();
      hasHydrated.current = true;
    }
  }, [hydrate]);

  if (isAuthenticated) {
    // Redirect to the page they came from, or default to home
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
