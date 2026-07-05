import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  X } from
'lucide-react';
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    path: '/shipments',
    label: 'Shipments',
    icon: Package
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: Users
  },
  {
    path: '/categories',
    label: 'Categories',
    icon: Tags
  },
  {
    path: '/loyalty',
    label: 'Loyalty & Offers',
    icon: Gift
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: BarChart3
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings
  }];

  const handleLogout = () => {
    navigate('/');
  };
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={() => setIsMobileMenuOpen(false)} />

      }

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-zinc-900 border-r border-zinc-800
        transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Ship className="w-8 h-8 text-yellow-500 mr-3" />
          <span className="text-lg font-bold text-white tracking-wide">
            LA GRANDE MARQUE
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center px-3 py-2.5 rounded-lg transition-colors
                      ${isActive ? 'bg-yellow-500/10 text-yellow-500' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}
                    `}>
                    
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>);

            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-lg transition-colors">
            
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden text-zinc-400 hover:text-white">
            
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center space-x-4">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium text-zinc-100">Admin User</div>
              <div className="text-zinc-500">admin@lagrandemarque.com</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-zinc-950 font-bold">
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>);

}