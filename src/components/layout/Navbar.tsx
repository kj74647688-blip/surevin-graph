import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, RefreshCw, UserCheck, ShieldCheck, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, loginAsAdmin, loginAsTeacher, availableTeachers } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              SF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  ScoreFuture
                </span>
                <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-mono">
                  {user.role}
                </span>
              </div>
              <div className="text-3xs text-slate-400 font-medium hidden sm:block">
                Academic Information & Analytics System
              </div>
            </div>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Switch Persona (For Evaluation) */}
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-3xs font-bold text-slate-400 uppercase px-2">Switch View:</span>
              <button
                type="button"
                onClick={() => loginAsTeacher('SF-TEA-J8M4Q6')}
                className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-all cursor-pointer ${
                  user.role === 'TEACHER' && user.teacherId === 'SF-TEA-J8M4Q6'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Teacher: Jyoti Panchal (X - Plat)
              </button>
              <button
                type="button"
                onClick={loginAsAdmin}
                className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-all cursor-pointer ${
                  user.role === 'ADMIN'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin: Dr. Verma
              </button>
            </div>

            {/* User Info Capsule */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                <div className="text-3xs text-slate-500 font-mono">
                  {user.role === 'TEACHER' ? `${user.teacherId} (Class ${user.assignedClass} – ${user.assignedSection})` : 'System Administrator'}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
