import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../utils/storage';
import { TeacherSignupModal } from './TeacherSignupModal';
import { ShieldCheck, GraduationCap, Lock, Check, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginAsAdmin, loginAsTeacher, loginWithCredentials, loginWithGoogle, availableTeachers } = useAuth();
  const [loginRole, setLoginRole] = useState<'TEACHER' | 'ADMIN'>('TEACHER');
  const [teacherIdInput, setTeacherIdInput] = useState('SF-TEA-J8M4Q6');
  const [passwordInput, setPasswordInput] = useState('SF-TEA-J8M4Q6');
  const [adminIdInput, setAdminIdInput] = useState('admin');
  const [adminPasswordInput, setAdminPasswordInput] = useState('admin');
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginWithGoogle(emailInput);
    if (!res.success) {
      setErrorMsg(res.message || 'Email not recognized. Please sign up or use a valid teacher email.');
    } else {
      setShowGoogleModal(false);
    }
  };

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (loginRole === 'TEACHER') {
      const res = loginWithCredentials(teacherIdInput, passwordInput);
      if (!res.success) {
        setErrorMsg(res.message || 'Login failed. Please verify your Teacher ID and Password.');
      }
    } else {
      const res = loginWithCredentials(adminIdInput, adminPasswordInput);
      if (!res.success) {
        setErrorMsg(res.message || 'Login failed. Please verify Admin credentials.');
      }
    }
  };

  const handleResetData = () => {
    if (confirm('Reset application to default seed data? (Jyoti Panchal, Class VI & X, subjects and sample records will be reloaded).')) {
      StorageService.resetToDefaultData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

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

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/95 backdrop-blur-md py-7 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          {/* Policy Notice Box */}
          <div className="mb-5 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-2xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block">Strict 2-Role Access Policy:</strong>
              Only ADMIN and TEACHER logins are permitted. There is no student authentication or student dashboard.
            </div>
          </div>

          {/* Role Tabs */}
          <div className="flex rounded-xl bg-slate-800/90 p-1 mb-5 border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setLoginRole('TEACHER');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                loginRole === 'TEACHER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Teacher Login
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginRole('ADMIN');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                loginRole === 'ADMIN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Login
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Credential Form */}
          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            {loginRole === 'TEACHER' ? (
              <>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Teacher ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherIdInput}
                    onChange={(e) => setTeacherIdInput(e.target.value)}
                    placeholder="e.g. SF-TEA-J8M4Q6"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300">
                      Password *
                    </label>
                    <span className="text-3xs text-amber-300 font-medium">
                      Password is your Teacher ID
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter your Teacher ID as password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-medium focus:outline-none focus:border-blue-500"
                  />
                  <p className="mt-1 text-3xs text-slate-400">
                    Rule: Jo Teacher ID hogi wahi password hoga for login.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Sign In as Teacher
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignupOpen(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                  >
                    Don't have a Teacher ID? Create Account (Self-Registration)
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Admin ID or Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminIdInput}
                    onChange={(e) => setAdminIdInput(e.target.value)}
                    placeholder="admin or principal@scorefuture.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Sign In as Administrator
                </button>
              </>
            )}
          </form>

          {/* Quick Access Pills for Evaluator convenience */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="text-3xs uppercase tracking-wider text-slate-400 font-semibold mb-2 text-center">
              Quick Test Personas
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => loginAsTeacher('SF-TEA-J8M4Q6')}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-all cursor-pointer"
              >
                <div className="text-2xs font-bold text-white truncate">Jyoti Panchal</div>
                <div className="text-3xs text-blue-300 font-mono">SF-TEA-J8M4Q6</div>
              </button>

              <button
                type="button"
                onClick={loginAsAdmin}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-all cursor-pointer"
              >
                <div className="text-2xs font-bold text-white truncate">Dr. Alok Verma</div>
                <div className="text-3xs text-amber-300 font-mono">ADMIN ACCESS</div>
              </button>
            </div>
          </div>

          {/* Google Auth Alternative */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 rounded-xl text-2xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              <span>Or sign in with Google Account</span>
            </button>
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
      {isSignupOpen && (
        <TeacherSignupModal
          isOpen={isSignupOpen}
          onClose={() => setIsSignupOpen(false)}
          onSuccess={(newTeacher) => {
            loginAsTeacher(newTeacher.teacherId);
          }}
        />
      )}
    </div>
  );
};
