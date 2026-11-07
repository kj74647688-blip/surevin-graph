import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TeacherSignupModal } from './TeacherSignupModal';
import { ShieldCheck, AlertCircle, LogIn, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, loginWithGoogle, loginAsTeacher, sendPasswordReset } = useAuth();
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  // Forgot password view
  const [isForgotView, setIsForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifierInput.trim()) {
      setErrorMsg('Please enter your User ID or Email address.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginWithCredentials(identifierInput, passwordInput);
      if (!res.success) {
        setErrorMsg(res.message || 'Login failed. Please check your credentials and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMsg(res.message || 'Google authentication failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    setForgotError(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await sendPasswordReset(forgotEmail);
      if (res.success) {
        setForgotMsg(res.message || 'Password reset email sent! Check your inbox.');
      } else {
        setForgotError(res.message || 'Failed to send reset email.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Error requesting password reset.');
    } finally {
      setForgotLoading(false);
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
          
          {isForgotView ? (
            /* Forgot Password Form */
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsForgotView(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base font-bold text-white">Reset Account Password</h3>
              </div>

              <p className="text-xs text-slate-300">
                Enter your registered Firebase email address. We will send a secure link to reset your password.
              </p>

              {forgotMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{forgotMsg}</span>
                </div>
              )}

              {forgotError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. teacher@surevin.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{forgotLoading ? 'Sending Email...' : 'Send Password Reset Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgotView(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 cursor-pointer block"
                >
                  Back to Sign In
                </button>
              </form>
            </div>
          ) : (
            /* Main Sign In Form */
            <div>
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
                    placeholder="e.g. teacher@surevin.edu or SF-TEA-2026-XXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotView(true)}
                      className="text-3xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
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
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-3xs text-slate-500">
            <span>ScoreFuture Engine</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Firebase Auth
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
