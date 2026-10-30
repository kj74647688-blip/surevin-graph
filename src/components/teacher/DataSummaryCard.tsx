import React from 'react';
import { SpreadsheetValidationSummary } from '../../types';
import { CheckCircle2, AlertTriangle, AlertCircle, FileCheck, Users, BookOpen, ArrowUp } from 'lucide-react';

interface DataSummaryCardProps {
  summary: SpreadsheetValidationSummary;
  onScrollToTable?: () => void;
}

export const DataSummaryCard: React.FC<DataSummaryCardProps> = ({ summary, onScrollToTable }) => {
  const hasErrors = summary.errors.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Section 2 — Live Data Validation & Summary
            </h3>
            <p className="text-2xs text-slate-500">
              Automatic inspection of marks boundaries, negative values, and completion rates
            </p>
          </div>
        </div>

        {hasErrors ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{summary.errors.length} Invalid Entries Detected</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All Marks Verified & Ready</span>
          </span>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Students */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-3xs uppercase font-bold text-slate-400">Total Students</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{summary.totalStudents}</div>
          </div>

          {/* Total Subjects */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-3xs uppercase font-bold text-slate-400">Total Subjects</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{summary.totalSubjects}</div>
          </div>

          {/* Valid Marks */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
            <div className="text-3xs uppercase font-bold text-emerald-700">Valid Marks</div>
            <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{summary.validMarks}</div>
          </div>

          {/* Missing Marks */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-center">
            <div className="text-3xs uppercase font-bold text-amber-700">Missing Marks</div>
            <div className="text-xl font-bold font-mono text-amber-900 mt-1">{summary.missingMarks}</div>
          </div>

          {/* Invalid Entries */}
          <div className={`p-3 rounded-xl border text-center ${
            summary.invalidEntries > 0 ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-3xs uppercase font-bold ${summary.invalidEntries > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
              Invalid Marks
            </div>
            <div className={`text-xl font-bold font-mono mt-1 ${summary.invalidEntries > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {summary.invalidEntries}
            </div>
          </div>

          {/* Complete Students */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-3xs uppercase font-bold text-slate-500">Complete Students</div>
            <div className="text-xl font-bold font-mono text-indigo-700 mt-1">{summary.completeStudents}</div>
          </div>

          {/* Incomplete Students */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-3xs uppercase font-bold text-slate-500">Incomplete</div>
            <div className="text-xl font-bold font-mono text-slate-600 mt-1">{summary.incompleteStudents}</div>
          </div>
        </div>

        {/* Detailed Error List if Invalid Entries exist */}
        {hasErrors && (
          <div className="mt-4 p-4 bg-rose-50/80 rounded-xl border border-rose-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Action Required: Please correct the following invalid entries before generating final graphs</span>
              </div>
              {onScrollToTable && (
                <button
                  type="button"
                  onClick={onScrollToTable}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Return to Table & Edit</span>
                </button>
              )}
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
              {summary.errors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-white rounded-lg border border-rose-200 text-xs flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-3xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Row {err.rowIdx + 1}
                    </span>
                    <strong className="text-slate-900">{err.studentName || 'Unnamed Student'}</strong>
                    <span className="text-slate-500">· Subject: <strong>{err.subjectName}</strong></span>
                    <span className="font-mono text-rose-700 font-bold bg-rose-50 px-1.5 rounded">
                      Value: "{err.cellValue}"
                    </span>
                  </div>
                  <div className="text-xs text-rose-700 font-medium">{err.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
