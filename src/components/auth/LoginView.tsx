import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TeacherSignupModal } from './TeacherSignupModal';
import { ShieldCheck, Lock, AlertCircle, LogIn } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, loginAsTeacher } = useAuth();
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = loginWithCredentials(identifierInput, passwordInput);
    if (!res.success) {
      setErrorMsg(res.message || 'Login failed. Please check your User ID / Email and Password.');
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
          Niwari Modinagar · ScoreFuture Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/95 backdrop-blur-md py-7 px-6 shadow-2xl rounded-2xl sm:px-8 border border-slate-800">
          {/* Policy Notice Box */}
          <div className="mb-5 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-2xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block">Institutional Portal Login:</strong>
              Log in with your Admin email or assigned Teacher ID to access performance records and graph generators.
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Unified Credential Form */}
          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                User ID or Email *
              </label>
              <input
                type="text"
                required
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                placeholder="e.g. admin@surevin.edu or SF-TEA-2026-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Portal</span>
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
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-3xs text-slate-500">
            <span>ScoreFuture System</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure Access
            </span>
          </div>
        </div>
      </div>

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
