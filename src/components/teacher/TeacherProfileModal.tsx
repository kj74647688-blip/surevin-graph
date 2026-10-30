import React, { useState } from 'react';
import { Teacher } from '../../types';
import { StorageService } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Mail, Phone, Briefcase, Award, X, Check, ArrowLeft, History } from 'lucide-react';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToHistory?: () => void;
  teacher: Teacher;
  onProfileUpdated: (updatedTeacher: Teacher) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigateToHistory,
  teacher,
  onProfileUpdated,
}) => {
  const { logout } = useAuth();
  const [name, setName] = useState(teacher.name);
  const [designation, setDesignation] = useState(teacher.designation || 'Senior Secondary Teacher');
  const [phone, setPhone] = useState(teacher.phone || '');
  const [department, setDepartment] = useState(teacher.department || 'Mathematics & Science');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.updateTeacherProfile(teacher.teacherId, {
      name: name.trim(),
      designation: designation.trim(),
      phone: phone.trim(),
      department: department.trim(),
    });

    if (updated) {
      StorageService.addLog({
        performedBy: {
          role: 'TEACHER',
          id: teacher.teacherId,
          name: updated.name,
        },
        action: 'UPDATE_PROFILE',
        details: `Updated teacher profile details for ${updated.name} (${updated.teacherId}).`,
      });

      onProfileUpdated(updated);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header with Blue Gradient */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg border border-white/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Teacher Profile</h2>
              <p className="text-xs text-blue-100">
                ScoreFuture Educational Academic Identity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Admin Managed (Read-Only) Info Pill Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Administrator-Assigned Credentials (Read-Only)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-3xs text-slate-400 block font-semibold">Teacher ID</span>
                <span className="font-mono font-bold text-indigo-700">{teacher.teacherId}</span>
              </div>
              <div>
                <span className="text-3xs text-slate-400 block font-semibold">Assigned Class & Section</span>
                <span className="font-bold text-slate-800">Class {teacher.assignedClass} – {teacher.assignedSection}</span>
              </div>
              <div className="col-span-2">
                <span className="text-3xs text-slate-400 block font-semibold">Verified Google Account</span>
                <span className="font-mono text-slate-600 text-2xs">{teacher.email}</span>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Designation *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Secondary Teacher (Mathematics)"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                placeholder="e.g. Science & Mathematics"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Footer Controls matching prompt */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onNavigateToHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToHistory();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>My Graph History</span>
                </button>
              )}
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
              >
                Logout
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Back to Graph Generator
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
