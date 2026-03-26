import { useEffect, useCallback, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
];
const SESSION_CHECK_INTERVAL_MS = 60_000; // Check every minute

export function AuthGuard() {
  const { isAuthenticated, isSessionExpired, logout, updateActivity, hydrate } = useAuthStore();
  const location = useLocation();
  const hasHydrated = useRef(false);

  // Hydrate auth state on mount
  useEffect(() => {
    if (!hasHydrated.current) {
      hydrate();
      hasHydrated.current = true;
    }
  }, [hydrate]);

  // Track user activity
  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      updateActivity();
    }
  }, [isAuthenticated, updateActivity]);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity]);

  // Periodically check session expiry
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (isSessionExpired()) {
        logout();
      }
    }, SESSION_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, isSessionExpired, logout]);

  // Check session on every route change
  useEffect(() => {
    if (isAuthenticated && isSessionExpired()) {
      logout();
    }
  }, [location.pathname, isAuthenticated, isSessionExpired, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
