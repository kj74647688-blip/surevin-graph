import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Teacher } from '../../types';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { X, GraduationCap, CheckCircle2, KeyRound, AlertCircle, Loader2, Mail } from 'lucide-react';

interface TeacherSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTeacher: Teacher) => void;
}

export const TeacherSignupModal: React.FC<TeacherSignupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerTeacherWithFirebase } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolName, setSchoolName] = useState('Surevin International Residential School');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedClass, setSelectedClass] = useState('VI');
  const [section, setSection] = useState('Gold');
  const [subjectsInput, setSubjectsInput] = useState('English, Hindi, Mathematics, Science');

  // Inline Validation States
  const [errorMsg, setErrorMsg] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTeacher, setSuccessTeacher] = useState<Teacher | null>(null);

  if (!isOpen) return null;

  const handlePhoneBlur = () => {
    if (!mobileNumber.trim()) {
      setPhoneError('');
      return;
    }
    const val = validatePhoneNumber(mobileNumber, 'IN');
    if (!val.isValid) {
      setPhoneError(val.error || 'Invalid Indian mobile number.');
    } else {
      setPhoneError('');
    }
  };

  const handleEmailBlur = () => {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (cleanEmail && !emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address format.');
    } else {
      setEmailError('');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPhoneError('');
    setEmailError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPass = password.trim();

    if (!cleanName || !cleanEmail) {
      setErrorMsg('Please enter your Full Name and Email address.');
      return;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address (e.g. teacher@surevinschool.com).');
      return;
    }

    // Phone validation
    const phoneVal = validatePhoneNumber(mobileNumber, 'IN');
    if (!phoneVal.isValid) {
      setErrorMsg(phoneVal.error || 'Please enter a valid mobile number (e.g., +91 98765 43210).');
      setPhoneError(phoneVal.error || 'Invalid number format');
      return;
    }

    if (!cleanPass) {
      setErrorMsg('Please set a password for your account.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPass !== confirmPassword.trim()) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    const subList = subjectsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await registerTeacherWithFirebase({
        fullName: cleanName,
        email: cleanEmail,
        password: cleanPass,
        phone: phoneVal.e164 || mobileNumber,
        assignedClass: selectedClass,
        assignedSection: section,
        subjects: subList,
        schoolName,
      });

      if (res.success && res.teacher) {
        setSuccessTeacher(res.teacher);
      } else {
        setErrorMsg(res.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during account registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-5 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 font-bold border border-white/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Teacher Self-Registration</h3>
              <p className="text-3xs text-blue-200">Surevin Institutional Teacher Account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {successTeacher ? (
            <div className="text-center py-5 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-extrabold text-white">Teacher Account Created Successfully!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your institutional account is registered and active. Save your login credentials below:
              </p>
              
              <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 text-left space-y-2.5 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Teacher ID:</span>
                  <span className="text-amber-300 font-extrabold text-sm tracking-wider">{successTeacher.teacherId}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Registered Email:</span>
                  <span className="text-white font-medium">{successTeacher.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Your Password:</span>
                  <span className="text-emerald-400 font-bold">{password}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-700/60">
                  <span className="text-slate-400">Class & Section:</span>
                  <span className="text-indigo-300 font-bold">Class {successTeacher.assignedClass} – {successTeacher.assignedSection}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Teacher ID: ${successTeacher.teacherId}\nEmail: ${successTeacher.email}\nPassword: ${password}`);
                    alert(`Copied login details to clipboard:\nTeacher ID: ${successTeacher.teacherId}\nPassword: ${password}`);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  Copy Credentials
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSuccess(successTeacher);
                    onClose();
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Log In Directly
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jyoti Panchal"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    onBlur={handleEmailBlur}
                    placeholder="teacher@surevinschool.com"
                    className={`w-full px-3 py-2.5 rounded-xl bg-slate-800 border text-white text-xs focus:outline-none ${
                      emailError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {emailError && <span className="text-3xs text-rose-400 mt-0.5 block">{emailError}</span>}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Set Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Mobile Number (+91 Indian Format) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => { setMobileNumber(e.target.value); setPhoneError(''); }}
                    onBlur={handlePhoneBlur}
                    placeholder="+91 98765 43210 or 9876543210"
                    className={`w-full px-3 py-2.5 rounded-xl bg-slate-800 border text-white text-xs focus:outline-none ${
                      phoneError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {phoneError && <span className="text-3xs text-rose-400 mt-0.5 block">{phoneError}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Class *
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'VI', 'X', 'XII'].map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Section *
                  </label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="Gold"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Subjects Taught (Comma separated) *
                </label>
                <input
                  type="text"
                  required
                  value={subjectsInput}
                  onChange={(e) => setSubjectsInput(e.target.value)}
                  placeholder="English, Hindi, Mathematics, Science"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/60 text-blue-200 text-3xs flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Verification email will be sent automatically to your address upon submission.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSubmitting ? 'Registering Account...' : 'Register Teacher Account'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
