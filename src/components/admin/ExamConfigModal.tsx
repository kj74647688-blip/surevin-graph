import React, { useState } from 'react';
import { Examination, Subject } from '../../types';
import { StorageService } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, X, Plus, Trash2, Check, Sparkles } from 'lucide-react';

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  examToEdit?: Examination | null;
  onSaved: () => void;
}

export const ExamConfigModal: React.FC<ExamConfigModalProps> = ({
  isOpen,
  onClose,
  examToEdit,
  onSaved,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(examToEdit?.name || '');
  const [academicSession, setAcademicSession] = useState(examToEdit?.academicSession || '2025-2026');
  const [status, setStatus] = useState<Examination['status']>(examToEdit?.status || 'active');
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    if (examToEdit?.subjects && examToEdit.subjects.length > 0) {
      return [...examToEdit.subjects];
    }
    return [
      { id: 'sub-math', name: 'Mathematics', code: 'MTH-101', maxMarks: 100, passingMarks: 40 },
      { id: 'sub-phy', name: 'Physics', code: 'PHY-101', maxMarks: 100, passingMarks: 40 },
      { id: 'sub-chem', name: 'Chemistry', code: 'CHM-101', maxMarks: 100, passingMarks: 40 },
      { id: 'sub-eng', name: 'English Literature', code: 'ENG-101', maxMarks: 100, passingMarks: 40 },
    ];
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddSubject = () => {
    const id = 'sub-' + Date.now().toString(36);
    setSubjects((prev) => [
      ...prev,
      { id, name: 'New Subject', code: 'SUB-101', maxMarks: 100, passingMarks: 40 },
    ]);
  };

  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) {
      setError('An examination must have at least one subject.');
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubjectChange = (id: string, field: keyof Subject, val: any) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an examination title.');
      return;
    }

    const exams = StorageService.getExams();
    const isNew = !examToEdit;
    const examId = examToEdit?.id || 'exam-' + Date.now().toString(36);

    const examData: Examination = {
      id: examId,
      name: name.trim(),
      academicSession,
      startDate: examToEdit?.startDate || new Date().toISOString().split('T')[0],
      endDate: examToEdit?.endDate || new Date().toISOString().split('T')[0],
      status,
      subjects,
    };

    if (isNew) {
      exams.push(examData);
    } else {
      const idx = exams.findIndex((e) => e.id === examId);
      if (idx >= 0) exams[idx] = examData;
    }

    StorageService.saveExams(exams);

    // Audit Log
    StorageService.addLog({
      performedBy: {
        role: 'ADMIN',
        id: user?.id || 'SF-ADM-001',
        name: user?.name || 'Administrator',
      },
      action: isNew ? 'CREATE_EXAM' : 'UPDATE_EXAM',
      details: `${isNew ? 'Created' : 'Updated'} examination: ${examData.name} (${examData.subjects.length} subjects configured with maximum marks).`,
      metadata: { examId: examData.id, subjectCount: examData.subjects.length },
    });

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold">
                {examToEdit ? 'Configure Examination & Subjects' : 'Create New Examination'}
              </h2>
              <p className="text-2xs text-slate-400">Manage subject roster, codes, and maximum marks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Examination Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mid-Term Examination 2026"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Subjects Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Subjects & Maximum Marks
              </label>
              <button
                type="button"
                onClick={handleAddSubject}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Subject Name</th>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3 text-center">Max Marks</th>
                    <th className="py-2 px-3 text-center">Passing</th>
                    <th className="py-2 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-medium"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={sub.code}
                          onChange={(e) => handleSubjectChange(sub.id, 'code', e.target.value)}
                          className="w-24 px-2 py-1 text-xs font-mono border border-slate-200 rounded uppercase"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <input
                          type="number"
                          min="10"
                          max="200"
                          value={sub.maxMarks}
                          onChange={(e) => handleSubjectChange(sub.id, 'maxMarks', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs font-mono text-center border border-slate-200 rounded font-bold"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={sub.maxMarks}
                          value={sub.passingMarks}
                          onChange={(e) => handleSubjectChange(sub.id, 'passingMarks', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs font-mono text-center border border-slate-200 rounded"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Examination Setup</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
