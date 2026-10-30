import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../utils/storage';
import { ShieldCheck, GraduationCap, Lock, Check, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginAsAdmin, loginAsTeacher, loginWithGoogle, availableTeachers } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const ok = loginWithGoogle(emailInput);
    if (!ok) {
      setErrorMsg(`No authorized account found for "${emailInput}". Please select an authorized account below.`);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset application to default seed data? (Jyoti Panchal, 40 students in Class X – Platinum, exams and marks will be reloaded).')) {
      StorageService.resetToDefaultData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Crest */}
        <div className="w-20 h-20 rounded-2xl bg-white/10 p-2 mx-auto flex items-center justify-center shadow-xl shadow-blue-900/40 mb-3 border border-white/20 backdrop-blur-xs">
          <img
            src="/assets/aistudio/surevin_babe9959.jpg"
            alt="Surevin International Residential School Crest"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl">
          Surevin International Residential School
        </h1>
        <p className="mt-1 text-xs text-blue-200 font-semibold tracking-wide uppercase">
          Niwari Modinagar · ScoreFuture Academic System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          {/* Policy Notice Box */}
          <div className="mb-6 p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-2xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block">Strict 2-Role Access Policy:</strong>
              Students exist strictly as academic records managed by teachers. There is no student authentication or login portal in this system.
            </div>
          </div>

          <div className="space-y-4">
            {/* Primary Google Auth Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-700 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all shadow-xs cursor-pointer group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Authorized Google Account</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-3xs uppercase tracking-wider">
                <span className="bg-slate-900 px-3 text-slate-500 font-semibold">
                  Or Instant Role Access
                </span>
              </div>
            </div>

            {/* Quick Login Cards for Evaluators */}
            <div className="space-y-2.5">
              {/* Teacher Jyoti Panchal (Target Requirement) */}
              <button
                type="button"
                onClick={() => loginAsTeacher('SF-TEA-J8M4Q6')}
                className="w-full text-left p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 hover:bg-indigo-900/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Jyoti Panchal
                    </span>
                    <span className="text-3xs font-mono font-bold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">
                      SF-TEA-J8M4Q6
                    </span>
                  </div>
                  <div className="text-2xs text-indigo-200/70 mt-0.5">
                    Class X – Platinum · 40 Enrolled Student Records
                  </div>
                </div>
                <span className="text-3xs font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-md">
                  Login as Teacher →
                </span>
              </button>

              {/* Administrator */}
              <button
                type="button"
                onClick={loginAsAdmin}
                className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      Dr. Alok Verma
                    </span>
                    <span className="text-3xs font-mono font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-2xs text-slate-400 mt-0.5">
                    Principal & Academic Administrator (School-Wide Access)
                  </div>
                </div>
                <span className="text-3xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md">
                  Login as Admin →
                </span>
              </button>
            </div>
          </div>

          {/* Reset App Data Button */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-3xs text-slate-500">
            <span>ScoreFuture v2.4</span>
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Sample Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sign-In Simulation Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-900 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <h3 className="text-sm font-bold">Sign in with Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Choose an authorized school account to continue to <strong>ScoreFuture</strong>:
              </p>

              <div className="space-y-2">
                {/* Admin */}
                <div
                  onClick={() => {
                    loginAsAdmin();
                    setShowGoogleModal(false);
                  }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">Dr. Alok Verma</div>
                    <div className="text-2xs text-slate-500 font-mono">principal@scorefuture.edu</div>
                  </div>
                  <span className="text-3xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Administrator
                  </span>
                </div>

                {/* Teachers */}
                {availableTeachers.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      loginAsTeacher(t.id);
                      setShowGoogleModal(false);
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.name}</div>
                      <div className="text-2xs text-slate-500 font-mono">{t.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 block">
                        Class {t.assignedClass} – {t.assignedSection}
                      </span>
                      <span className="text-3xs font-mono text-slate-400">{t.teacherId}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom email form */}
              <form onSubmit={handleCustomGoogleSubmit} className="pt-3 border-t border-slate-100">
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  Or enter another authorized email:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => { setEmailInput(e.target.value); setErrorMsg(''); }}
                    placeholder="user@scorefuture.edu"
                    className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-2xs text-rose-600 mt-1 font-medium">{errorMsg}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
