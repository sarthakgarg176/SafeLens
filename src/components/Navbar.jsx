import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Menu } from 'lucide-react';

export default function Navbar({ toggleSidebar }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-border glass-card sticky top-0 z-20 backdrop-blur-md">

      {/* Left Side: Greeting & Dynamic Title Identity */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Open Trigger */}
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl border border-border bg-surface hover:bg-white/5 md:hidden transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-slate-300" />
        </button>

        <div>
          <motion.h2
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="font-display font-bold text-2xl text-text-main tracking-tight"
          >
            Greetings, Admin
          </motion.h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Here's what's happening with your digital assets today.
          </p>
        </div>
      </div>

      {/* Center: Global Monitoring Search Bar */}
      <div className="flex-1 max-w-xl w-full md:mx-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500 transition-colors group-focus-within:text-brand-primary" />
          </div>
          <input
            type="text"
            placeholder="Search assets, domains, vulnerabilities, or incidents..."
            className="block w-full pl-11 pr-14 py-2.5 rounded-xl text-sm font-medium border border-border bg-black/20 focus:bg-surface text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:outline-none transition-all duration-200"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border border-border bg-surface text-[10px] font-medium text-slate-400 shadow-sm font-mono">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Side: Quick Action Triggers */}
      <div className="flex items-center gap-3.5 self-end md:self-auto">

        {/* Notification Hub Trigger */}
        <button
          className="relative p-2.5 rounded-xl border border-border bg-surface hover:bg-white/5 hover:border-slate-700 transition-all duration-200 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-high opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-risk-high shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
          </span>
        </button>

      </div>
    </header>
  );
}