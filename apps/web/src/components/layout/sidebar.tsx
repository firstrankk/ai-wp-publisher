'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  FileText,
  Key,
  Users,
  Settings,
  LogOut,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  FileStack,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useSidebar } from '@/app/(dashboard)/layout';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '#3b82f6' },  // blue
  { name: 'Sites', href: '/sites', icon: Globe, color: '#10b981' },          // emerald
  { name: 'Articles', href: '/articles', icon: FileText, color: '#f59e0b' }, // amber
  { name: 'Bulk Create', href: '/bulk-create', icon: FileStack, color: '#8b5cf6', isNew: true }, // violet
  { name: 'API Keys', href: '/api-keys', icon: Key, color: '#f97316' },      // orange
  { name: 'Users', href: '/users', icon: Users, color: '#06b6d4' },          // cyan
  { name: 'Settings', href: '/settings', icon: Settings, color: '#6b7280' }, // gray
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuth();
  const { isOpen, setIsOpen, isCollapsed, setIsCollapsed } = useSidebar();

  const handleLogout = () => {
    clearAuth();
  };

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center justify-between px-4 border-b"
        style={{ borderColor: '#e5e7eb' }}
      >
        <Link
          href="/dashboard"
          className={cn("flex items-center gap-3 hover:opacity-80 transition-opacity", isCollapsed && "justify-center w-full")}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
            style={{ backgroundColor: '#dc2626' }}
          >
            <Sparkles className="h-5 w-5" style={{ color: '#ffffff' }} />
          </div>
          {!isCollapsed && (
            <h1 className="text-lg font-bold" style={{ color: '#1f2937' }}>AI Publisher</h1>
          )}
        </Link>

        {/* Close button for mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Collapse button for desktop */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hidden lg:flex items-center justify-center py-3 hover:bg-gray-50 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5 text-gray-500" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isCollapsed && 'justify-center px-2'
              )}
              style={{
                backgroundColor: isActive ? '#fef2f2' : 'transparent',
                color: isActive ? '#dc2626' : '#4b5563',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className="h-5 w-5 flex-shrink-0"
                style={{ color: (item as any).color || (isActive ? '#dc2626' : '#9ca3af') }}
              />
              {!isCollapsed && (
                <span className="flex items-center gap-2">
                  {item.name}
                  {(item as any).isNew && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                      NEW
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t p-4" style={{ borderColor: '#e5e7eb' }}>
        {isCollapsed ? (
          // Collapsed view - just avatar
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full font-bold"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              title={user?.name || 'User'}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ) : (
          // Expanded view
          <>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full font-bold flex-shrink-0"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: '#1f2937' }}>
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-xs" style={{ color: '#6b7280' }}>
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
