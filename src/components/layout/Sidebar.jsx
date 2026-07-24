import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  Database,
  Cpu,
  Globe,
  Terminal,
  ShieldAlert,
  FileText,
  Settings as SettingsIcon,
  X,
  UserCheck,
  LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { key: 'policy', name: 'Policy Ingestion', icon: Database },
  { key: 'brain', name: 'Agentic Brain', icon: Cpu },
  { key: 'whitelist', name: 'Domain Whitelist', icon: Globe },
  { key: 'logs', name: 'Interception Logs', icon: Terminal },
  { key: 'alerts', name: 'Spoofing Alerts', icon: ShieldAlert },
  { key: 'reports', name: 'Reports & Health', icon: FileText },
  { key: 'settings', name: 'Settings', icon: SettingsIcon }
];

/**
 * Sidebar Component
 * Collapsible Cyberpunk Sidebar navigation linking all 8 dashboard tabs.
 *
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab key
 * @param {Function} props.setActiveTab - State setter callback
 * @param {boolean} props.isOpen - governed open state for mobile views
 * @param {Function} props.toggleSidebar - mobile toggle trigger callback
 */
export default function Sidebar({ activeTab, setActiveTab, isOpen, toggleSidebar }) {
  
  const handleLogout = () => {
    localStorage.removeItem('cloakai_session_token');
    window.location.href = '/login';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d111c]/90 backdrop-blur-xl border-r border-white/5 text-gray-300 transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 glow-status-success">
            <Shield className="w-5 h-5 stroke-[2]" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-info)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
            </span>
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-wider text-white">
              SAFELENS 2.0
            </h1>
            <span className="text-[9px] uppercase tracking-widest font-mono text-gray-500">
              SOC Command Center
            </span>
          </div>
        </div>

        {/* Mobile Close Trigger */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 md:hidden transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Navigation Layer */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                isActive
                  ? 'text-white bg-white/5 border border-white/10 shadow-inner'
                  : 'text-gray-500 hover:text-white hover:bg-white/3 border border-transparent'
              }`}
            >
              {/* Active Tab Glow Stripe */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-success)] glow-status-success" />
              )}

              <span className="relative z-10">
                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[var(--color-success)]' : 'text-gray-600 group-hover:text-white'}`} />
              </span>
              <span className="relative z-10 text-left uppercase">{item.name}</span>

              {isActive && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-success)] glow-status-success relative z-10" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile / Logout Info */}
      <div className="p-4 border-t border-white/5 bg-black/20 space-y-3 font-mono">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/2 border border-white/5 shadow-sm select-none">
          <div className="relative">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-[var(--color-success)] to-[var(--color-info)] flex items-center justify-center text-black font-bold text-xs">
              AD
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[var(--color-success)] rounded-full border-2 border-[#0a0d14] flex items-center justify-center">
              <UserCheck className="w-2.5 h-2.5 text-black" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white truncate">
                SEC ADMIN
              </p>
              <span className="text-[8px] px-1 rounded font-extrabold bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 uppercase tracking-widest">
                SOC
              </span>
            </div>
            <p className="text-[9px] text-gray-500 truncate mt-0.5">
              Enterprise Plan
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded border border-transparent text-xs font-semibold text-gray-500 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 hover:border-[var(--color-danger)]/15 transition-all duration-200 cursor-pointer group"
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="uppercase">Sign Out</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 h-full z-50 md:hidden flex flex-col"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

Sidebar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};
