import React from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';

export type UserRole = 'student' | 'admin' | 'technician';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  backendOnline: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  backendOnline,
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-2 ring-indigo-50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                  FixFlow<span className="text-indigo-600">.AI</span>
                </span>
                <span className="text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Smart Triage
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI Incident Classification • Vector Deduplication • SOP Copilot
              </p>
            </div>
          </div>

          {/* Backend Status Pill (Mobile) */}
          <div className="md:hidden flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              backendOnline 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {backendOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Center: Segmented Role Switcher Tabs */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-inner">
            <button
              onClick={() => onRoleChange('student')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentRole === 'student'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${currentRole === 'student' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Reporter / Student</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${currentRole === 'admin' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Admin Operations</span>
            </button>

            <button
              onClick={() => onRoleChange('technician')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentRole === 'technician'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Wrench className={`w-4 h-4 ${currentRole === 'technician' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Field Technician</span>
            </button>
          </div>
        </div>

        {/* Right side status & refresh (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
            backendOnline 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {backendOnline ? 'System Live' : 'Backend Offline'}
          </span>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh active tickets & metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
