import React, { useState, useRef, useEffect } from 'react';
import {
  SpreadsheetSubject,
  SpreadsheetRow,
  ValidationErrorItem
} from '../../types';
import {
  Upload,
  Download,
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  BookOpen,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface SpreadsheetMarksTableProps {
  subjects: SpreadsheetSubject[];
  rows: SpreadsheetRow[];
  onSubjectsChange: (subjects: SpreadsheetSubject[]) => void;
  onRowsChange: (rows: SpreadsheetRow[]) => void;
  validationErrors: ValidationErrorItem[];
  onOpenUploadModal: () => void;
  onDownloadTemplate: () => void;
}

export const SpreadsheetMarksTable: React.FC<SpreadsheetMarksTableProps> = ({
  subjects,
  rows,
  onSubjectsChange,
  onRowsChange,
  validationErrors,
  onOpenUploadModal,
  onDownloadTemplate,
}) => {
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [removeSubjectModalOpen, setRemoveSubjectModalOpen] = useState(false);
  const [subjectToRemove, setSubjectToRemove] = useState<string>('');
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubMaxMarks, setNewSubMaxMarks] = useState<number>(80);

  // Table cell ref map for keyboard navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getCellKey = (rowIdx: number, colKey: string) => `${rowIdx}-${colKey}`;

  // 1. Cell Change Handlers
  const handleStudentNameChange = (rowIdx: number, val: string) => {
    const updated = [...rows];
    updated[rowIdx] = { ...updated[rowIdx], studentName: val };
    onRowsChange(updated);
  };

  const handleMarkChange = (rowIdx: number, subjectId: string, val: string) => {
    const updated = [...rows];
    const currentMarks = { ...updated[rowIdx].marks, [subjectId]: val };
    updated[rowIdx] = { ...updated[rowIdx], marks: currentMarks };
    onRowsChange(updated);
  };

  const handleSubjectNameChange = (subjectId: string, val: string) => {
    const updated = subjects.map((s) => (s.id === subjectId ? { ...s, name: val } : s));
    onSubjectsChange(updated);
  };

  const handleSubjectMaxMarksChange = (subjectId: string, val: number) => {
    const safeVal = Math.max(1, isNaN(val) ? 1 : val);
    const updated = subjects.map((s) => (s.id === subjectId ? { ...s, maxMarks: safeVal } : s));
    onSubjectsChange(updated);
  };

  // 2. Toolbar Actions
  const handleAddStudent = () => {
    const newRow: SpreadsheetRow = {
      id: `row-${Date.now().toString(36)}-${rows.length + 1}`,
      studentName: '',
      marks: {},
    };
    onRowsChange([...rows, newRow]);

    // Focus the new row's student name input
    setTimeout(() => {
      const key = getCellKey(rows.length, 'name');
      inputRefs.current[key]?.focus();
    }, 50);
  };

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newSub: SpreadsheetSubject = {
      id: `sub-${Date.now().toString(36)}`,
      name: newSubName.trim(),
      maxMarks: newSubMaxMarks > 0 ? newSubMaxMarks : 80,
    };

    onSubjectsChange([...subjects, newSub]);
    setNewSubName('');
    setNewSubMaxMarks(80);
    setAddSubjectModalOpen(false);
  };

  const handleConfirmRemoveSubject = () => {
    if (!subjectToRemove) return;
    const updatedSubjects = subjects.filter((s) => s.id !== subjectToRemove);
    // Also remove marks for this subject from rows
    const updatedRows = rows.map((r) => {
      const copyMarks = { ...r.marks };
      delete copyMarks[subjectToRemove];
      return { ...r, marks: copyMarks };
    });

    onSubjectsChange(updatedSubjects);
    onRowsChange(updatedRows);
    setRemoveSubjectModalOpen(false);
    setSubjectToRemove('');
  };

  const handleClearTable = () => {
    if (confirm('Are you sure you want to clear the entire draft table? (Previously saved examinations and history will NOT be deleted).')) {
      // Keep existing subjects, reset rows to 3 empty sample rows
      const emptyRows: SpreadsheetRow[] = [
        { id: 'row-1', studentName: '', marks: {} },
        { id: 'row-2', studentName: '', marks: {} },
        { id: 'row-3', studentName: '', marks: {} },
      ];
      onRowsChange(emptyRows);
    }
  };

  const handleDeleteRow = (rowIdx: number) => {
    if (rows.length <= 1) {
      alert('The table must have at least one student row.');
      return;
    }
    const updated = rows.filter((_, idx) => idx !== rowIdx);
    onRowsChange(updated);
  };

  // 3. Multi-Cell Paste from Excel/CSV
  const handlePaste = (e: React.ClipboardEvent, startRowIdx: number, startColKey: string) => {
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) {
      // Ordinary single cell paste, allow default
      return;
    }

    e.preventDefault();

    // Parse tab-delimited and newline-delimited grid
    const pastedLines = text.split(/\r\n|\n|\r/).filter((line) => line.length > 0);
    const pasteGrid = pastedLines.map((line) => line.split('\t'));

    const colOrder = ['name', ...subjects.map((s) => s.id)];
    const startColIdx = colOrder.indexOf(startColKey);
    if (startColIdx === -1) return;

    const updatedRows = [...rows];

    pasteGrid.forEach((pasteRow, pRIdx) => {
      const targetRowIdx = startRowIdx + pRIdx;

      // Expand rows if paste extends beyond current length
      if (targetRowIdx >= updatedRows.length) {
        updatedRows.push({
          id: `row-paste-${Date.now().toString(36)}-${targetRowIdx}`,
          studentName: '',
          marks: {},
        });
      }

      pasteRow.forEach((cellVal, pCIdx) => {
        const targetColIdx = startColIdx + pCIdx;
        if (targetColIdx < colOrder.length) {
          const colKey = colOrder[targetColIdx];
          const cleanVal = cellVal.trim();

          if (colKey === 'name') {
            updatedRows[targetRowIdx] = {
              ...updatedRows[targetRowIdx],
              studentName: cleanVal,
            };
          } else {
            updatedRows[targetRowIdx] = {
              ...updatedRows[targetRowIdx],
              marks: {
                ...updatedRows[targetRowIdx].marks,
                [colKey]: cleanVal,
              },
            };
          }
        }
      });
    });

    onRowsChange(updatedRows);
  };

  // 4. Keyboard Navigation (Arrows, Enter, Tab)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colKey: string
  ) => {
    const colOrder = ['name', ...subjects.map((s) => s.id)];
    const colIdx = colOrder.indexOf(colKey);

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextRow = rowIdx + 1;
      if (nextRow < rows.length) {
        inputRefs.current[getCellKey(nextRow, colKey)]?.focus();
      } else if (e.key === 'Enter') {
        handleAddStudent();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIdx > 0) {
        inputRefs.current[getCellKey(rowIdx - 1, colKey)]?.focus();
      }
    } else if ((e.key === 'ArrowRight' && e.currentTarget.selectionEnd === e.currentTarget.value.length) || e.key === 'Tab') {
      if (colIdx < colOrder.length - 1) {
        e.preventDefault();
        const nextCol = colOrder[colIdx + 1];
        inputRefs.current[getCellKey(rowIdx, nextCol)]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && e.currentTarget.selectionStart === 0) {
      if (colIdx > 0) {
        e.preventDefault();
        const prevCol = colOrder[colIdx - 1];
        inputRefs.current[getCellKey(rowIdx, prevCol)]?.focus();
      }
    }
  };

  // Check if cell has validation error
  const getCellError = (rowIdx: number, subjectId: string): ValidationErrorItem | undefined => {
    return validationErrors.find(
      (err) => err.rowIdx === rowIdx && err.subjectId === subjectId
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* SECTION 1 HEADER & SPREADSHEET TOOLBAR */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Section 1 — Upload or Prepare Marks
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Interactive Excel spreadsheet. Edit student names, subject headings, and maximum marks directly in cells. Supports clipboard pasting from Excel.
            </p>
          </div>

          {/* Toolbar Controls (Matching Prompt specifications 1 to 6) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Upload Excel / CSV */}
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Excel / CSV</span>
            </button>

            {/* 2. Download Excel Template (50 Students) */}
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Download clean Excel template with 50 student rows"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Excel Template (50 Students)</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

            {/* 3. + Add Student */}
            <button
              type="button"
              onClick={handleAddStudent}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add Student</span>
            </button>

            {/* 4. + Add Subject */}
            <button
              type="button"
              onClick={() => setAddSubjectModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add Subject</span>
            </button>

            {/* 5. − Remove Subject */}
            <button
              type="button"
              onClick={() => {
                setSubjectToRemove(subjects[subjects.length - 1]?.id || '');
                setRemoveSubjectModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <span>− Remove Subject</span>
            </button>

            {/* 6. Clear Table */}
            <button
              type="button"
              onClick={handleClearTable}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Reset current spreadsheet draft"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* SPREADSHEET TABLE CONTAINER */}
      <div className="overflow-x-auto max-h-[600px] border-b border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header Row 1: Subject Names */}
          <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0 z-20 shadow-2xs">
            <tr className="border-b border-slate-300">
              <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono text-3xs border-r border-slate-200">
                #
              </th>
              <th className="py-2.5 px-4 min-w-[220px] border-r border-slate-200">
                <span className="text-xs uppercase tracking-wider text-slate-700">Student Name</span>
              </th>
              {subjects.map((sub) => (
                <th key={sub.id} className="py-2.5 px-3 min-w-[150px] border-r border-slate-200 bg-slate-100">
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => handleSubjectNameChange(sub.id, e.target.value)}
                      title="Click to edit subject name"
                      className="w-full text-xs font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white border-b border-transparent focus:border-blue-500 rounded px-1 py-0.5 outline-hidden"
                    />
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3 w-14 text-center text-slate-400 font-medium">
                Action
              </th>
            </tr>

            {/* Header Row 2: Maximum Marks (Editable) */}
            <tr className="bg-amber-100/60 border-b-2 border-amber-300 text-amber-950 font-bold text-2xs">
              <td className="py-2 px-3 text-center border-r border-amber-200 text-3xs font-mono">
                MAX
              </td>
              <td className="py-2 px-4 border-r border-amber-200 uppercase tracking-wider text-amber-900 font-bold flex items-center justify-between">
                <span>Maximum Marks</span>
                <span className="text-3xs font-normal text-amber-700">(Set for each column)</span>
              </td>
              {subjects.map((sub) => (
                <td key={sub.id} className="py-2 px-3 border-r border-amber-200">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={sub.maxMarks}
                      onChange={(e) => handleSubjectMaxMarksChange(sub.id, Number(e.target.value))}
                      title={`Edit Maximum Marks for ${sub.name}`}
                      className="w-20 px-2 py-0.5 text-xs font-mono font-bold text-center bg-white border border-amber-300 focus:border-blue-600 rounded shadow-2xs"
                    />
                  </div>
                </td>
              ))}
              <td className="py-2 px-3 text-center text-3xs text-amber-600">
                —
              </td>
            </tr>
          </thead>

          {/* Student Rows */}
          <tbody className="divide-y divide-slate-200 font-medium">
            {rows.map((row, rowIdx) => {
              const hasRowName = !!row.studentName.trim();

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    !hasRowName && rowIdx === rows.length - 1
                      ? 'bg-slate-50/60'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Row Index */}
                  <td className="py-1 px-3 text-center font-mono text-3xs text-slate-400 border-r border-slate-200 bg-slate-50">
                    {rowIdx + 1}
                  </td>

                  {/* Student Name Cell */}
                  <td className="p-1 border-r border-slate-200">
                    <input
                      ref={(el) => { inputRefs.current[getCellKey(rowIdx, 'name')] = el; }}
                      type="text"
                      placeholder={`Enter student name ${rowIdx + 1}...`}
                      value={row.studentName}
                      onChange={(e) => handleStudentNameChange(rowIdx, e.target.value)}
                      onFocus={() => setActiveCell({ rowIdx, colKey: 'name' })}
                      onKeyDown={(e) => handleKeyDown(e, rowIdx, 'name')}
                      onPaste={(e) => handlePaste(e, rowIdx, 'name')}
                      className={`w-full px-2.5 py-1.5 text-xs rounded border transition-all ${
                        !row.studentName.trim() && rows.length > 3
                          ? 'border-dashed border-slate-300 bg-white text-slate-500'
                          : 'border-transparent hover:border-slate-300 focus:border-blue-500 bg-white text-slate-900 font-semibold'
                      }`}
                    />
                  </td>

                  {/* Subject Marks Input Cells (Light Yellow Editable Cells as required by UI specs!) */}
                  {subjects.map((sub) => {
                    const markVal = row.marks[sub.id] || '';
                    const cellError = getCellError(rowIdx, sub.id);
                    const isAbsent = /^[Aa]b?(sent)?$/i.test(markVal);

                    return (
                      <td key={sub.id} className="p-1 border-r border-slate-200">
                        <div className="relative">
                          <input
                            ref={(el) => { inputRefs.current[getCellKey(rowIdx, sub.id)] = el; }}
                            type="text"
                            placeholder="—"
                            value={markVal}
                            onChange={(e) => handleMarkChange(rowIdx, sub.id, e.target.value)}
                            onFocus={() => setActiveCell({ rowIdx, colKey: sub.id })}
                            onKeyDown={(e) => handleKeyDown(e, rowIdx, sub.id)}
                            onPaste={(e) => handlePaste(e, rowIdx, sub.id)}
                            className={`w-full text-center px-2 py-1.5 text-xs font-mono font-bold rounded transition-all outline-hidden ${
                              cellError
                                ? 'bg-rose-50 text-rose-700 border-2 border-rose-500 focus:ring-1 focus:ring-rose-500'
                                : isAbsent
                                ? 'bg-slate-100 text-slate-500 border border-slate-300'
                                : 'bg-amber-50/80 hover:bg-amber-100/60 focus:bg-white text-slate-900 border border-amber-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                            title={cellError ? cellError.reason : isAbsent ? 'Student Marked Absent' : `Mark out of ${sub.maxMarks}`}
                          />
                          {cellError && (
                            <span
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-full flex items-center justify-center text-3xs font-bold pointer-events-none shadow"
                              title={cellError.reason}
                            >
                              !
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Row Delete Button */}
                  <td className="py-1 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(rowIdx)}
                      title="Delete this student row"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Quick Bar Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-2xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>Row count: <strong className="text-slate-800">{rows.length}</strong></span>
          <span>·</span>
          <span>Subjects: <strong className="text-slate-800">{subjects.length}</strong></span>
          <span>·</span>
          <span className="hidden sm:inline">Use Arrow keys & Enter to navigate. Type "A" for Absent.</span>
        </div>
        <button
          type="button"
          onClick={handleAddStudent}
          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Student Row</span>
        </button>
      </div>

      {/* Modal: Add Subject */}
      {addSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Add New Subject Column</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter subject title and maximum marks.
            </p>
            <form onSubmit={handleAddSubjectSubmit} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Social Science, Sanskrit, IT"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
                  Maximum Marks *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="500"
                  value={newSubMaxMarks}
                  onChange={(e) => setNewSubMaxMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:border-blue-500"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddSubjectModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Remove Subject */}
      {removeSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Remove Subject Column</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select which subject column to delete. Its student marks will be discarded.
            </p>
            <div className="space-y-3">
              <select
                value={subjectToRemove}
                onChange={(e) => setSubjectToRemove(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} (Max {sub.maxMarks})
                  </option>
                ))}
              </select>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRemoveSubjectModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveSubject}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
