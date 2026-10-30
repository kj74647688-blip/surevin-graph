import React, { useState } from 'react';
import { SchoolSettings, Teacher } from '../../types';
import { FileText, Download, X, Building2, User, BookOpen, Calendar } from 'lucide-react';

interface PdfHeadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExamName: string;
  defaultSession: string;
  schoolSettings: SchoolSettings;
  teacher: Teacher;
  onConfirmDownload: (examName: string, session: string) => void;
}

export const PdfHeadingModal: React.FC<PdfHeadingModalProps> = ({
  isOpen,
  onClose,
  defaultExamName,
  defaultSession,
  schoolSettings,
  teacher,
  onConfirmDownload,
}) => {
  const [examName, setExamName] = useState(defaultExamName || 'Mid-Term Examination 2026');
  const [session, setSession] = useState(defaultSession || schoolSettings.academicSession || '2025-2026');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) return;
    onConfirmDownload(examName.trim(), session.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">PDF Heading & Report Header Details</h2>
              <p className="text-xs text-blue-100">
                Verify institution, examination, and session before generating PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Institutional Information Pill Box (From Settings & Profile) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{schoolSettings.schoolName}</span>
            </div>
            <div className="text-2xs text-slate-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Teacher: <strong>{teacher.name}</strong> ({teacher.teacherId}) · Class {teacher.assignedClass} – {teacher.assignedSection}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Examination Name *
            </label>
            <input
              type="text"
              required
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Mid-Term Examination 2026, Annual Preparatory"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Session *
            </label>
            <input
              type="text"
              required
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. 2025-2026"
              className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-slate-300 focus:border-blue-500"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            <strong>Combined Landscape PDF:</strong> Every subject graph will be generated on a separate page with official header, percentage bars, student names, and performance legend.
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Print / Save All Graphs as PDF</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
