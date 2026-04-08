import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, CheckSquare,
  LogOut, Zap, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/formatters';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 bg-primary-900 border-b border-white/10">
        <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center shadow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base leading-tight block">ClientFlow</span>
          <span className="text-blue-300 text-xs">Onboarding Platform</span>
        </div>
      </div>

      {/* Nav section label */}
      <div className="px-4 pt-5 pb-1">
        <span className="text-blue-300/60 text-xs font-semibold uppercase tracking-widest">Main Menu</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link group ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10 mb-3" />

      {/* User profile */}
      <div className="px-3 pb-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{user?.fullName}</p>
            <p className="text-xs text-blue-300 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link sidebar-link-inactive w-full">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary-900 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary-900 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-500 rounded flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">ClientFlow</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded text-white hover:bg-white/10">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-primary-900 h-full shadow-elevated">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
