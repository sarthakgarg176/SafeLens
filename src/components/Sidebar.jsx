import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  Globe,
  Activity,
  FileText,
  AlertTriangle,
  Layers,
  Trash2,
  Percent,
  Settings,
  X,
  UserCheck,
  LogOut
} from 'lucide-react';

// Exact navigation structure matching system specs
const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Assets', icon: Globe, path: '/assets' },
  { name: 'Scan History', icon: Activity, path: '/scan-history' },
  { name: 'Reports', icon: FileText, path: '/reports' },
  { name: 'Incidents', icon: AlertTriangle, path: '/incidents' },
  { name: 'Similarity Search', icon: Layers, path: '/similarity' },
  { name: 'Takedown Center', icon: Trash2, path: '/takedown' },
  { name: 'Risk Analysis', icon: Percent, path: '/risk-analysis' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('cloakai_session_token');
    window.location.href = '/login';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full glass-card border-r border-border text-text-main transition-colors duration-300">

      {/* Brand Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary neon-glow-purple">
            <Shield className="w-6 h-6 stroke-[2]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-primary"></span>
            </span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Privacy Shield AI
            </h1>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
              v1.0.0 Enterprise
            </span>
          </div>
        </div>

        {/* Mobile Close Trigger */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Navigation Layer */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group cursor-pointer ${isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5'
                }`}
            >
              {/* Animated Background Pillar Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <span className="relative z-10">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-primary'
                  }`} />
              </span>
              <span className="relative z-10 font-sans tracking-wide">{item.name}</span>

              {isActive && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white relative z-10" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Zone: Profile + Sign Out ───────────────────────────────── */}
      <div className="p-4 border-t border-border bg-black/10 space-y-2">

        {/* Admin profile card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl glass-card border-none bg-surface/50 shadow-sm">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-sm shadow-md">
              AD
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-risk-safe rounded-full border-2 border-surface flex items-center justify-center">
              <UserCheck className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-200 truncate">
                Security Admin
              </p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-extrabold bg-brand-primary/10 text-brand-primary uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
              Enterprise Plan · Active
            </p>
          </div>
        </div>

        {/* Sign Out button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-white/5 hover:border-red-400/15 transition-all duration-200 cursor-pointer group"
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View Sidebar Structure (Permanent Layout Window) */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation Matrix */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark Backdrop Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 h-full z-50 md:hidden flex flex-col"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}