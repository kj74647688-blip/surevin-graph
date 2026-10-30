import React, { useState } from 'react';
import {
  StudentRecord,
  Examination,
  StudentMarksRecord,
  SubjectMarkEntry
} from '../../types';
import {
  calculateSubjectPerformance,
  PERFORMANCE_COLORS
} from '../../utils/constants';
import { StorageService } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { X, Check, AlertCircle, Save } from 'lucide-react';

interface StudentMarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  exam: Examination;
  marksRecord?: StudentMarksRecord;
  onSaveSuccess: () => void;
}

export const StudentMarksModal: React.FC<StudentMarksModalProps> = ({
  isOpen,
  onClose,
  student,
  exam,
  marksRecord,
  onSaveSuccess,
}) => {
  const { user } = useAuth();

  // Local state for each subject's mark entry
  const [formData, setFormData] = useState<Record<string, {
    obtained: string;
    isAbsent: boolean;
    isUnverified: boolean;
    remarks: string;
  }>>(() => {
    const initial: Record<string, any> = {};
    exam.subjects.forEach((sub) => {
      const entry = marksRecord?.marks?.[sub.id];
      initial[sub.id] = {
        obtained: entry?.obtained !== null && entry?.obtained !== undefined ? String(entry.obtained) : '',
        isAbsent: !!entry?.isAbsent,
        isUnverified: !!entry?.isUnverified,
        remarks: entry?.remarks || '',
      };
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleScoreChange = (subjectId: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        obtained: val,
        isAbsent: false,
        isUnverified: false,
      },
    }));
  };

  const handleToggleAbsent = (subjectId: string) => {
    setFormData((prev) => {
      const cur = prev[subjectId];
      const willBeAbsent = !cur.isAbsent;
      return {
        ...prev,
        [subjectId]: {
          ...cur,
          isAbsent: willBeAbsent,
          isUnverified: false,
          obtained: willBeAbsent ? '' : cur.obtained,
        },
      };
    });
  };

  const handleSave = () => {
    const marksPayload: Record<string, SubjectMarkEntry> = {};
    const auditChanges: string[] = [];

    exam.subjects.forEach((sub) => {
      const current = formData[sub.id];
      const oldEntry = marksRecord?.marks?.[sub.id];
      const oldVal: string | number = oldEntry?.isAbsent
        ? 'Absent'
        : oldEntry?.isUnverified
        ? 'Unverified'
        : oldEntry?.obtained ?? 'None';

      if (current.isAbsent) {
        marksPayload[sub.id] = { obtained: null, isAbsent: true, remarks: current.remarks };
        if (oldVal !== 'Absent') {
          auditChanges.push(`${sub.name}: ${oldVal} → Absent`);
        }
      } else if (current.isUnverified || current.obtained.trim() === '') {
        marksPayload[sub.id] = { obtained: null, isUnverified: true, remarks: current.remarks };
        if (oldVal !== 'Unverified' && oldVal !== 'None') {
          auditChanges.push(`${sub.name}: ${oldVal} → Unverified`);
        }
      } else {
        const num = Number(current.obtained);
        const validNum = isNaN(num) ? 0 : Math.min(sub.maxMarks, Math.max(0, num));
        marksPayload[sub.id] = { obtained: validNum, isAbsent: false, isUnverified: false, remarks: current.remarks };
        if (oldVal !== validNum) {
          auditChanges.push(`${sub.name}: ${oldVal} → ${validNum}`);
        }
      }
    });

    const existingMarks = StorageService.getMarks();
    const existingIdx = existingMarks.findIndex(
      (m) => m.studentId === student.id && m.examId === exam.id
    );

    const timestamp = new Date().toISOString();
    const editorId = user?.teacherId || user?.id || 'SF-USER';
    const editorName = user?.name || 'Authorized User';

    if (existingIdx >= 0) {
      existingMarks[existingIdx] = {
        ...existingMarks[existingIdx],
        marks: marksPayload,
        updatedAt: timestamp,
        updatedBy: editorId,
        updatedByName: editorName,
      };
    } else {
      existingMarks.push({
        id: `mark-${student.id}-${exam.id}`,
        studentId: student.id,
        examId: exam.id,
        marks: marksPayload,
        updatedAt: timestamp,
        updatedBy: editorId,
        updatedByName: editorName,
      });
    }

    StorageService.saveMarks(existingMarks);

    // Save Audit Log
    if (auditChanges.length > 0) {
      StorageService.addLog({
        performedBy: {
          role: user?.role || 'TEACHER',
          id: editorId,
          name: editorName,
        },
        action: 'UPDATE_MARK',
        details: `Updated marks for ${student.name} (Roll #${student.rollNumber}) in ${exam.name}: ${auditChanges.join('; ')}`,
        metadata: { studentId: student.id, examId: exam.id, changes: auditChanges },
      });
    }

    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">{student.name}</h2>
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                Roll #{student.rollNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Class {student.class} – {student.section} · {exam.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="text-xs text-slate-500 font-medium">
            Enter marks obtained by the student. Percentages and ScoreFuture color bands will recalculate automatically in real time.
          </div>

          <div className="space-y-3">
            {exam.subjects.map((sub) => {
              const current = formData[sub.id];
              const obtainedNum = current.obtained !== '' && !isNaN(Number(current.obtained)) ? Number(current.obtained) : null;
              
              const calculated = calculateSubjectPerformance(sub, {
                obtained: obtainedNum,
                isAbsent: current.isAbsent,
                isUnverified: current.isUnverified || current.obtained === '',
              });

              const colorDef = PERFORMANCE_COLORS[calculated.band];

              return (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-[180px]">
                    <div className="text-xs font-bold text-slate-900">{sub.name}</div>
                    <div className="text-3xs text-slate-500 font-mono mt-0.5">
                      Code: {sub.code} · Max: {sub.maxMarks} · Pass: {sub.passingMarks}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Mark Input */}
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        max={sub.maxMarks}
                        disabled={current.isAbsent}
                        value={current.obtained}
                        onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                        placeholder={`0–${sub.maxMarks}`}
                        className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border text-center transition-colors ${
                          current.isAbsent
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                    </div>

                    {/* Absent Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAbsent(sub.id)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        current.isAbsent
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {current.isAbsent ? 'Absent (Marked)' : 'Mark Absent'}
                    </button>

                    {/* Calculated Percentage & Band Badge */}
                    <div className="w-28 text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-slate-900">
                        {calculated.percentage !== null ? `${calculated.percentage}%` : '—'}
                      </div>
                      <span
                        className="inline-block text-3xs font-semibold px-2 py-0.5 rounded-full text-white mt-0.5"
                        style={{ backgroundColor: colorDef.fillHex }}
                      >
                        {calculated.bandLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Marks & Log Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
