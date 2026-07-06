'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  Gift,
  BarChart3,
  Settings,
  LogOut,
  Ship,
  Menu,
  FileText,
  ChevronDown,
  User,
  FileSearch,
  AlertTriangle,
  UserPlus,
  Bell,
  Star,
  Receipt,
  Truck } from
  'lucide-react';
import { useUiStore } from '@/lib/store';
import { useSessionTimeout } from '@/lib/useSessionTimeout';
import { useAppConfig } from '@/lib/swr';
import { supabase } from '@/lib/supabase/client';

const ICON_MAP: Record<string, React.ComponentType<{className?: string}>> = {
  LayoutDashboard, Users, Package, Tags, Gift, BarChart3, Settings, UserPlus, FileText, FileSearch,
  LogOut, Ship, Menu, ChevronDown, User, AlertTriangle, Bell, Star, Receipt, Truck
};

// Default navigation shown when app_config has no `navigation` entry yet.
// Keeps the sidebar usable out-of-the-box; overridden by DB config when present.
const DEFAULT_NAV: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/shipments', label: 'Shipments', icon: 'Truck' },
  { path: '/customers', label: 'Customers', icon: 'Users' },
  { path: '/categories', label: 'Categories', icon: 'Tags' },
  { path: '/offers', label: 'Offers', icon: 'Gift' },
  { path: '/reports', label: 'Reports', icon: 'BarChart3' },
  { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  { path: '/loyalty', label: 'Loyalty', icon: 'Star' },
  { path: '/receipts', label: 'Receipts', icon: 'Receipt' },
  { path: '/audit', label: 'Audit Logs', icon: 'FileSearch' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
  { path: '/staff', label: 'Staff', icon: 'UserPlus' },
];

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface LayoutProps {
  children: React.ReactNode;
}

type ResolvedNavItem = NavItem & { component: React.ComponentType<{className?: string}> };

export default function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, activeStaffName, activeStaffEmail, activeStaffPhoto } = useUiStore();
  const { config, loading } = useAppConfig();
  const navItems: ResolvedNavItem[] = ((config?.navigation && config.navigation.length ? config.navigation : DEFAULT_NAV) as NavItem[])
    .map((item: NavItem) => ({
      ...item,
      component: ICON_MAP[item.icon] || LayoutDashboard
    }))
    .filter((item: NavItem & { component?: React.ComponentType<{className?: string}> }): item is ResolvedNavItem => Boolean(item.component));
  const [showProfile, setShowProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      return stored === 'dark';
    }
    return false;
  });
  const [sessionWarning, setSessionWarning] = useState<{ remainingMinutes: number } | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useSessionTimeout(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem('activeStaffName');
    localStorage.removeItem('activeStaffEmail');
    localStorage.removeItem('activeStaffPhoto');
    router.push('/login');
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.remainingMinutes) setSessionWarning(detail);
    };
    window.addEventListener('session-warning', handler as EventListener);
    return () => window.removeEventListener('session-warning', handler as EventListener);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore sign-out errors; still clear local state
    }
    localStorage.removeItem('activeStaffName');
    localStorage.removeItem('activeStaffEmail');
    localStorage.removeItem('activeStaffPhoto');
    router.push('/login');
  };

  const getBreadcrumbs = () => {
    const path = pathname;
    const segments = path.split('/').filter(Boolean);
    const crumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/dashboard' }];

    const labels = config?.breadcrumbs || {};

    let build = '';
    segments.forEach((segment) => {
      build += `/${segment}`;
      if (labels[segment]) {
        crumbs.push({ label: labels[segment], href: build });
      }
    });

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const branding = config?.branding || {};

  if (loading) {
    return (
      <div className="flex flex-row min-h-screen bg-slate-50 text-navy-900 font-sans dark:bg-slate-950 dark:text-slate-100">
        <aside className="w-64 bg-navy-800 text-white flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <Ship className="w-6 h-6 sm:w-7 sm:h-7 text-gold mr-2 sm:mr-3" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">Loading...</span>
          </div>
        </aside>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-500">Loading layout...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-row min-h-screen bg-slate-50 text-navy-900 font-sans dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-navy-800 text-white
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-xl
          lg:static lg:translate-x-0
        `}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Ship className="w-6 h-6 sm:w-7 sm:h-7 text-gold mr-2 sm:mr-3" />
          <div>
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">{branding.companyName || 'LA GRANDE MARQUE'}</span>
            <div className="text-[9px] sm:text-[10px] text-blue-300 font-medium tracking-wide">{branding.tagline || 'SHIPPING ADMIN'}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 sm:py-4">
          <ul className="space-y-1 px-2 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.component;
              const isActive = pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium
                      ${isActive ? 'bg-white/10 text-gold' : 'text-blue-100 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2 sm:mr-3" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 sm:p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 sm:px-3 py-2 text-blue-200 hover:bg-white/5 hover:text-white rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
          >
            <LogOut className="w-4 h-4 mr-2 sm:mr-3" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 sm:h-16 bg-white/90 dark:bg-slate-900/90 dark:border-slate-700 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-navy-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white p-1"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <nav className="hidden sm:flex items-center text-xs sm:text-sm">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="mx-1 sm:mx-2 text-slate-400">/</span>}
                  <Link
                    href={crumb.href}
                    className={idx === breadcrumbs.length - 1 ? 'text-navy-900 dark:text-slate-100 font-medium' : 'text-slate-500 hover:text-navy-700 dark:hover:text-slate-300'}
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs sm:text-sm overflow-hidden">
                  {activeStaffPhoto ? (
                    <img src={activeStaffPhoto} alt={activeStaffName} className="w-full h-full object-cover" />
                  ) : (
                    activeStaffName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                  )}
                </div>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hidden sm:block" />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                   <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm overflow-hidden shrink-0">
                       {activeStaffPhoto ? (
                         <img src={activeStaffPhoto} alt={activeStaffName} className="w-full h-full object-cover" />
                       ) : (
                         activeStaffName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                       )}
                     </div>
                     <div className="min-w-0">
                       <div className="text-sm font-semibold text-navy-900 dark:text-slate-100 truncate">{activeStaffName}</div>
                       <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{activeStaffEmail}</div>
                     </div>
                   </div>
                  <div className="py-2">
                    <Link href="/profile" onClick={() => setShowProfile(false)} className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <User className="w-4 h-4 mr-3 text-slate-400" /> Profile
                    </Link>
                    <Link href="/settings" onClick={() => setShowProfile(false)} className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Settings className="w-4 h-4 mr-3 text-slate-400" /> Settings
                    </Link>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <LogOut className="w-4 h-4 mr-3" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {sessionWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-navy-900 dark:text-slate-100">Session Expiring Soon</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">You will be logged out in {sessionWarning.remainingMinutes} minutes due to inactivity.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setSessionWarning(null); }} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition-colors">Dismiss</button>
              <button onClick={async () => { setSessionWarning(null); await handleLogout(); }} className="btn-primary">Logout Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
