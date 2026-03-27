import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User, Globe } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';

/** Map pathname to a nav translation key for the page title. */
function getPageTitleKey(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return 'nav.home';

  const mapping: Record<string, string> = {
    bookings: 'nav.bookings',
    fleet: 'nav.fleet',
    categories: 'nav.categories',
    branches: 'nav.branches',
    customers: 'nav.customers',
    payments: 'nav.payments',
    maintenance: 'nav.maintenance',
    support: 'nav.support',
    pricing: 'nav.pricing',
    analytics: 'nav.analytics',
    campaigns: 'nav.campaigns',
    staff: 'nav.staff',
    settings: 'nav.settings',
    configuration: 'nav.configuration',
  };

  return mapping[segment] ?? 'nav.home';
}

export function TopBar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pageTitleKey = getPageTitleKey(location.pathname);
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const next = currentLang === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Page title */}
      <h1 className="text-lg font-semibold text-gray-900">
        {t(pageTitleKey)}
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Toggle language"
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase">{currentLang === 'en' ? 'AR' : 'EN'}</span>
        </button>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label={t('common.notifications', 'Notifications')}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
              {user?.name?.charAt(0)?.toUpperCase() ?? (
                <User className="h-4 w-4" />
              )}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 md:inline-block">
              {user?.name ?? 'Admin'}
            </span>
            <ChevronDown
              className={cn(
                'hidden h-4 w-4 text-gray-400 transition-transform md:block',
                userMenuOpen && 'rotate-180',
              )}
            />
          </button>

          {/* Dropdown menu */}
          {userMenuOpen && (
            <div className="absolute end-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email ?? 'admin@example.com'}
                </p>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
