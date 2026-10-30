import React, { useState } from 'react';
import { StorageService } from '../../utils/storage';
import { Teacher } from '../../types';
import { X, GraduationCap, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('Surevin International Residential School');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedClass, setSelectedClass] = useState('VI');
  const [section, setSection] = useState('Gold');
  const [subjectsInput, setSubjectsInput] = useState('English, Hindi, Mathematics, Science');
  const [adminIdInput, setAdminIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTeacher, setSuccessTeacher] = useState<Teacher | null>(null);

  if (!isOpen) return null;

  const classesList = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
  ];

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);

    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const teacherId = `SF-TEA-2026-${randomCode}`;

    const subList = subjectsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const assignedSubjects = subList.map((s, idx) => ({
      id: `sub-${idx}-${Date.now()}`,
      name: s,
      maxMarks: 80,
    }));

    const newTeacher: Teacher = {
      id: `tea-${Date.now()}`,
      teacherId,
      name: fullName,
      email,
      designation: 'Senior Teacher',
      assignedClass: selectedClass.replace('Class ', ''),
      assignedSection: section,
      academicSession: '2026-2027',
      assignedSubjects,
      assignedSubjectIds: assignedSubjects.map((s) => s.id),
      active: true,
      permissions: {
        canEditMarks: true,
        canExportReports: true,
        canAddStudents: true,
      },
    };

    StorageService.addTeacher(newTeacher);

    StorageService.addLog({
      performedBy: {
        role: 'TEACHER',
        id: teacherId,
        name: fullName,
      },
      action: 'TEACHER_SELF_SIGNUP',
      details: `Teacher ${fullName} self-registered with Teacher ID ${teacherId} for Class ${selectedClass} - ${section}.`,
      metadata: { teacherId, email, schoolName, adminId: adminIdInput || 'Independent' },
    });

    setSuccessTeacher(newTeacher);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 font-bold border border-white/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Teacher Self-Registration</h3>
              <p className="text-3xs text-blue-200">ScoreFuture Institutional Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {successTeacher ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-white">Registration Successful!</h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Your Teacher ID has been successfully generated. Your password is your Teacher ID.
              </p>
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 font-mono text-xs text-amber-300">
                Teacher ID: {successTeacher.teacherId}
              </div>
              <button
                type="button"
                onClick={() => {
                  onSuccess(successTeacher);
                  onClose();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Proceed to Teacher Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4 text-xs">
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
                    Google Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@surevinschool.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
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
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                <div className="col-span-1">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Optional Admin ID
                  </label>
                  <input
                    type="text"
                    value={adminIdInput}
                    onChange={(e) => setAdminIdInput(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
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
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Google OAuth verified. Your Teacher ID will serve as your secure login password.</span>
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Teacher Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
