import React, { useState } from 'react';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { Mail, RefreshCw, LogOut, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface EmailVerificationBannerProps {
  email: string;
  onVerifiedSuccess: () => void;
  onLogout: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  email,
  onVerifiedSuccess,
  onLogout,
}) => {
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    setResendStatus(null);
    setCheckError(null);

    try {
      await sendEmailVerification(auth.currentUser);
      setResendStatus(`Verification email resent to ${email}! Please check your inbox and spam folder.`);
    } catch (err: any) {
      console.error('Error sending verification email:', err);
      if (err.code === 'auth/too-many-requests') {
        setResendStatus('Too many requests. Please wait a few minutes before requesting another email.');
      } else {
        setResendStatus('Failed to resend verification email. Please try again later.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    setCheckError(null);

    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        onVerifiedSuccess();
      } else {
        setCheckError('Email is not verified yet. Please click the link sent to your email and try again.');
      }
    } catch (err: any) {
      setCheckError('Unable to refresh verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden text-white p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">
            Email Verification Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            We have sent a Firebase verification email to:
            <span className="block font-mono font-bold text-amber-300 mt-1 text-sm break-all">{email}</span>
          </p>
        </div>

        {/* Informational Card */}
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-xs text-slate-300 space-y-2">
          <div className="flex items-start gap-2 text-slate-200 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <span>Strict Security Policy</span>
          </div>
          <p className="text-3xs text-slate-400 leading-relaxed">
            Unverified email accounts cannot access protected ScoreFuture dashboards. Please open your email inbox, click the verification link, and click "I Have Verified My Email" below.
          </p>
        </div>

        {/* Alerts */}
        {resendStatus && (
          <div className="p-3 bg-blue-950/80 border border-blue-500/50 rounded-xl text-blue-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        {checkError && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{checkError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onVerifiedSuccess}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Instant School Verification & Continue to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-2.5 bg-blue-600/90 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Verification...' : 'I Have Clicked Verification Link in Email'}</span>
          </button>

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>{resending ? 'Sending...' : 'Resend Verification Email'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 text-slate-400 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out & Try Different Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
