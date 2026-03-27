import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  CalendarCheck,
  Car,
  LayoutGrid,
  Building2,
  Users,
  CreditCard,
  Wrench,
  Headphones,
  DollarSign,
  BarChart3,
  Megaphone,
  UserCog,
  Settings,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface NavItem {
  key: string;
  path: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { key: 'home', path: '/', icon: Home },
  { key: 'bookings', path: '/bookings', icon: CalendarCheck },
  { key: 'fleet', path: '/fleet', icon: Car },
  { key: 'categories', path: '/categories', icon: LayoutGrid },
  { key: 'branches', path: '/branches', icon: Building2 },
  { key: 'customers', path: '/customers', icon: Users },
  { key: 'payments', path: '/payments', icon: CreditCard },
  { key: 'maintenance', path: '/maintenance', icon: Wrench },
  { key: 'support', path: '/support', icon: Headphones },
  { key: 'pricing', path: '/pricing', icon: DollarSign },
  { key: 'analytics', path: '/analytics', icon: BarChart3 },
  { key: 'campaigns', path: '/campaigns', icon: Megaphone },
  { key: 'staff', path: '/staff', icon: UserCog },
  { key: 'settings', path: '/settings', icon: Settings },
  { key: 'configuration', path: '/configuration', icon: SlidersHorizontal },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 start-0 z-30 flex flex-col border-e border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      {/* Logo / App name */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            CR
          </div>
          {!collapsed && (
            <span className="truncate text-base font-semibold text-gray-900">
              {t('common.appName')}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
                title={collapsed ? t(`nav.${item.key}`) : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{t(`nav.${item.key}`)}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-gray-200 p-3">
        <button
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900',
            collapsed && 'justify-center px-2',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
