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
  AlertTriangle,
  UserPlus,
  Bell,
  Truck,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from
  'lucide-react';
import { useUiStore } from '@/lib/store';
import { useSessionTimeout } from '@/lib/useSessionTimeout';
import { useAppConfig } from '@/lib/swr';
import { supabase } from '@/lib/supabase/client';
import { ToastProvider } from '@/lib/toast';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Package, Tags, Gift, BarChart3, Settings, UserPlus, FileText,
  LogOut, Ship, Menu, ChevronDown, User, AlertTriangle, Bell, Truck, DollarSign
};

// Default navigation shown when app_config has no `navigation` entry yet.
// Keeps the sidebar usable out-of-the-box; overridden by DB config when present.
const DEFAULT_NAV: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/shipments', label: 'Shipments', icon: 'Truck' },
  { path: '/customers', label: 'Customers', icon: 'Users' },
  { path: '/categories', label: 'Categories', icon: 'Tags' },
  { path: '/offers', label: 'Offers', icon: 'Gift' },
  { path: '/expenses', label: 'Expenses', icon: 'DollarSign' },
  { path: '/reports', label: 'Reports', icon: 'BarChart3' },
  { path: '/notifications', label: 'Notifications', icon: 'Bell' },

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

type ResolvedNavItem = NavItem & { component: React.ComponentType<{ className?: string }> };

export default function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, activeStaffName, activeStaffEmail, activeStaffPhoto } = useUiStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const { config, loading } = useAppConfig();
  const baseNav: NavItem[] = (config?.navigation && config.navigation.length ? config.navigation : DEFAULT_NAV) as NavItem[];
  // Ensure Expenses is always in the nav
  if (!baseNav.some((item) => item.path === '/expenses')) {
    baseNav.splice(4, 0, { path: '/expenses', label: 'Expenses', icon: 'DollarSign' });
  }
  const navItems: ResolvedNavItem[] = baseNav
    .map((item: NavItem) => ({
      ...item,
      component: ICON_MAP[item.icon] || LayoutDashboard
    }))
    .filter((item: NavItem & { component?: React.ComponentType<{ className?: string }> }): item is ResolvedNavItem => Boolean(item.component));
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
    localStorage.removeItem('activeStaffRole');
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
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkActiveStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: staff } = await supabase
          .from('staff')
          .select('active')
          .eq('auth_uid', user.id)
          .maybeSingle();

        if (!staff?.active) {
          await supabase.auth.signOut();
          localStorage.removeItem('activeStaffName');
          localStorage.removeItem('activeStaffEmail');
          localStorage.removeItem('activeStaffPhoto');
          localStorage.removeItem('activeStaffRole');
          router.replace('/login');
        }
      }
    };

    checkActiveStatus();
  }, [router]);

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
    localStorage.removeItem('activeStaffRole');
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
      <div className="flex flex-row min-h-screen bg-[#0B0D12] text-white/90 font-sans">
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
    <ToastProvider>
    <div className="flex flex-row min-h-screen bg-[#0B0D12] text-white/90 font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-60 bg-[#0B0D12]/95 backdrop-blur-xl border-r border-white/[0.04] text-white
          transform transition-all duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
          lg:static lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-[4.5rem]' : ''}
        `}
      >
        <div className="h-16 flex items-center px-5 border-b border-white/[0.04]">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/20 flex items-center justify-center mr-3 shrink-0">
            <Ship className="w-5 h-5 text-cyan-400" />
          </div>
          <div className={sidebarCollapsed ? 'lg:hidden' : ''}>
            <span className="text-base font-display font-bold text-white tracking-wider">{branding.companyName || 'LA GRANDE'}</span>
            <div className="text-[11px] text-cyan-400/60 font-medium tracking-[0.15em] uppercase">{branding.tagline || 'SHIPPING'}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 premium-scroll">
          <div className="px-4 mb-2">
              <span className={`text-xs font-semibold text-white/15 uppercase tracking-[0.2em] ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                OPERATIONS
              </span>
            </div>
            <ul className="space-y-1.5 px-2 mb-5">
              {navItems.filter(i => ['Dashboard','Shipments','Customers','Categories','Offers','Expenses'].includes(i.label)).map((item) => {
                const Icon = item.component;
                const isActive = pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <Link href={item.path} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 text-base font-medium
                        ${isActive ? 'bg-cyan-500/[0.06] text-cyan-400 border-l-[3px] border-cyan-400 pl-[9px]' : 'text-white/40 hover:bg-white/[0.03] hover:text-white/80'}
                        ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-[22px] h-[22px] mr-3 transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-white/25 group-hover:text-white/60'}`} />
                    <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
                    {isActive && !sidebarCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,217,255,0.5)]" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="px-4 mb-2">
              <span className={`text-xs font-semibold text-white/15 uppercase tracking-[0.2em] ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                MANAGEMENT
              </span>
            </div>
            <ul className="space-y-1.5 px-2 mb-5">
              {navItems.filter(i => ['Reports','Notifications'].includes(i.label)).map((item) => {
                const Icon = item.component;
                const isActive = pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <Link href={item.path} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 text-base font-medium
                        ${isActive ? 'bg-pink-500/[0.06] text-pink-400 border-l-[3px] border-pink-400 pl-[9px]' : 'text-white/40 hover:bg-white/[0.03] hover:text-white/80'}
                        ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-[22px] h-[22px] mr-3 transition-colors duration-200 ${isActive ? 'text-pink-400' : 'text-white/25'}`} />
                    <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
                    {isActive && !sidebarCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(255,61,129,0.5)]" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="px-4 mb-2">
              <span className={`text-xs font-semibold text-white/15 uppercase tracking-[0.2em] ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                SYSTEM
              </span>
            </div>
            <ul className="space-y-1.5 px-2">
              {navItems.filter(i => ['Settings','Staff'].includes(i.label)).map((item) => {
                const Icon = item.component;
                const isActive = pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <Link href={item.path} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 text-base font-medium
                        ${isActive ? 'bg-white/[0.04] text-white border-l-[3px] border-white/30 pl-[9px]' : 'text-white/40 hover:bg-white/[0.03] hover:text-white/80'}
                        ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-[22px] h-[22px] mr-3 transition-colors duration-200 ${isActive ? 'text-white/60' : 'text-white/25'}`} />
                    <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
                    {isActive && !sidebarCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center p-3 text-white/15 hover:text-white/40 hover:bg-white/[0.02] transition-all duration-300"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        <div className={`p-3 border-t border-white/[0.04] ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center gap-2.5 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/10 flex items-center justify-center text-xs font-bold text-white/80">
                {activeStaffName.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0D12]" />
            </div>
            <div className={`min-w-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              <div className="text-sm font-medium text-white/70 truncate">{activeStaffName}</div>
              <div className="text-[11px] text-white/25 truncate">Admin</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center w-full mt-2 px-2 py-1.5 text-white/25 hover:bg-white/[0.03] hover:text-white/60 rounded-lg transition-all duration-200 text-sm font-medium ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-18 sm:h-20 lg:h-24 bg-[#0B0D12]/80 backdrop-blur-xl border-b border-white/[0.04] flex items-center justify-between px-5 md:px-8 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
              <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <div className="hidden sm:flex items-center gap-2.5 text-base">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-white/10">/</span>}
                  <Link href={crumb.href}
                    className={idx === breadcrumbs.length - 1 ? 'text-white/90 font-semibold' : 'text-white/30 hover:text-white/60 transition-colors'}>
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-white/25 font-mono tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
            </span>
            <div className="relative" ref={profileRef}>
              <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/[0.04] transition-all">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/20 border border-blue-400/10 flex items-center justify-center font-semibold text-base overflow-hidden">
                  {activeStaffPhoto ? (
                    <img src={activeStaffPhoto} alt={activeStaffName} className="w-full h-full object-cover" />
                  ) : (
                    activeStaffName.split(' ').map((n:string)=>n[0]).join('').slice(0,2)
                  )}
                </div>
                <ChevronDown className="w-5 h-5 text-white/25 hidden sm:block" />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#12141C] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-scaleIn origin-top-right">
                  <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/20 border border-blue-400/10 flex items-center justify-center font-semibold text-base shrink-0">
                      {activeStaffPhoto ? <img src={activeStaffPhoto} alt={activeStaffName} className="w-full h-full object-cover rounded-xl" /> : activeStaffName.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-white truncate">{activeStaffName}</div>
                      <div className="text-sm text-white/25 truncate">{activeStaffEmail}</div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link href="/profile" onClick={() => setShowProfile(false)} className="flex items-center px-4 py-2.5 text-base text-white/40 hover:text-white hover:bg-white/[0.03] transition-all"><User className="w-5 h-5 mr-3 text-white/15" /> Profile</Link>
                    <Link href="/settings" onClick={() => setShowProfile(false)} className="flex items-center px-4 py-2.5 text-base text-white/40 hover:text-white hover:bg-white/[0.03] transition-all"><Settings className="w-5 h-5 mr-3 text-white/15" /> Settings</Link>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 text-base text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"><LogOut className="w-5 h-5 mr-3" /> Logout</button>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/[0.06] rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div><h3 className="text-lg font-semibold text-white">Session Expiring</h3>
              <p className="text-base text-white/30">Logout in {sessionWarning.remainingMinutes}min.</p></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSessionWarning(null)} className="px-4 py-2 text-sm text-white/30 hover:text-white transition-colors">Dismiss</button>
              <button onClick={async () => { setSessionWarning(null); await handleLogout(); }} className="btn-primary">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ToastProvider>
  );
}
