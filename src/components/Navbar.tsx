import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  User,
  LogOut,
  FileText,
  LayoutDashboard,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'report' | 'my-reports' | 'authority' | 'emergency';
  onNavigate: (view: 'report' | 'my-reports' | 'authority' | 'emergency') => void;
  onOpenVictimAuth: (tab?: 'login' | 'register') => void;
  onOpenAuthorityAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenVictimAuth,
  onOpenAuthorityAuth,
}) => {
  const { user, logout } = useAuth();
  const isAuthority = user?.role === 'authority';
  const isVictim = user?.role === 'victim';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Branding */}
          <div
            onClick={() => onNavigate(isAuthority ? 'authority' : 'report')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  SmartCrime<span className="text-indigo-600 font-bold">Portal</span>
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-mono">
                  v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Unified Police Incident Reporting & Forensic Triage
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* If Authority: show Authority dashboard */}
            {isAuthority ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('authority')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'authority'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Authority Command Console</span>
                </button>
              </>
            ) : (
              /* If Victim or Guest: */
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('report')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'report'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>File Crime Report</span>
                </button>

                {isVictim && (
                  <button
                    type="button"
                    onClick={() => onNavigate('my-reports')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      currentView === 'my-reports'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>My Complaints</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onNavigate('emergency')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'emergency'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <PhoneCall className="w-4 h-4 text-rose-500" />
                  <span>Emergency Helplines</span>
                </button>
              </>
            )}
          </nav>

          {/* User Account / Auth Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                    <span>{user.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                        isAuthority
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {isAuthority ? `Officer (${user.badgeId || 'Police'})` : 'Citizen'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 transition cursor-pointer border border-slate-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenVictimAuth('login')}
                  className="px-3.5 py-2 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl transition cursor-pointer"
                >
                  Victim Portal
                </button>

                <button
                  type="button"
                  onClick={onOpenAuthorityAuth}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Authority Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
