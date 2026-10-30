import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  StudentRecord,
  Examination,
  StudentMarksRecord,
  SubjectMarkEntry
} from '../../types';
import { ExportService } from '../../utils/exportUtils';
import { StorageService } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
  exam: Examination;
  onUploadSuccess: () => void;
}

interface ParsedRow {
  studentId: string;
  rollNumber: string;
  name: string;
  marks: Record<string, SubjectMarkEntry>;
  errors: string[];
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  students,
  exam,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    ExportService.exportUploadTemplate(students, exam, format);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setErrorMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setErrorMsg('Uploaded file appears to be empty.');
          setIsProcessing(false);
          return;
        }

        // Match rows with students
        const results: ParsedRow[] = [];

        students.forEach((stu) => {
          // Find matching row in uploaded file by roll number or name
          const matchedRow = json.find((row) => {
            const rowRoll = String(row['Roll No'] || row['Roll'] || row['RollNo'] || row['rollNumber'] || '').trim();
            const rowName = String(row['Student Name'] || row['Name'] || row['studentName'] || '').trim().toLowerCase();
            return (
              (rowRoll && rowRoll === stu.rollNumber) ||
              (rowName && rowName === stu.name.toLowerCase())
            );
          });

          const rowMarks: Record<string, SubjectMarkEntry> = {};
          const errors: string[] = [];

          if (!matchedRow) {
            errors.push('Student not found in uploaded file.');
          } else {
            exam.subjects.forEach((sub) => {
              // Find column key that matches subject name or code
              const matchingColKey = Object.keys(matchedRow).find((key) => {
                const kLower = key.toLowerCase();
                return (
                  kLower.includes(sub.name.toLowerCase()) ||
                  kLower.includes(sub.code.toLowerCase())
                );
              });

              if (matchingColKey && matchedRow[matchingColKey] !== undefined && matchedRow[matchingColKey] !== '') {
                const val = matchedRow[matchingColKey];
                const strVal = String(val).trim().toUpperCase();

                if (strVal === 'A' || strVal === 'ABS' || strVal === 'ABSENT') {
                  rowMarks[sub.id] = { obtained: null, isAbsent: true };
                } else if (strVal === 'U' || strVal === 'UNVERIFIED') {
                  rowMarks[sub.id] = { obtained: null, isUnverified: true };
                } else {
                  const num = Number(val);
                  if (isNaN(num)) {
                    errors.push(`Invalid marks "${val}" for ${sub.name}`);
                  } else if (num < 0 || num > sub.maxMarks) {
                    errors.push(`${sub.name} marks (${num}) exceeds maximum allowed (${sub.maxMarks})`);
                  } else {
                    rowMarks[sub.id] = { obtained: num };
                  }
                }
              }
            });
          }

          results.push({
            studentId: stu.id,
            rollNumber: stu.rollNumber,
            name: stu.name,
            marks: rowMarks,
            errors,
          });
        });

        setParsedRows(results);
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Failed to parse file. Please verify it is a valid Excel (.xlsx) or CSV file.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleApplyMarks = () => {
    if (parsedRows.length === 0) return;

    const existingMarks = StorageService.getMarks();
    let updatedCount = 0;

    parsedRows.forEach((row) => {
      // Find existing mark entry for this student and exam
      const existingIdx = existingMarks.findIndex(
        (m) => m.studentId === row.studentId && m.examId === exam.id
      );

      const timestamp = new Date().toISOString();
      const editorId = user?.teacherId || user?.id || 'SF-USER';
      const editorName = user?.name || 'Authorized User';

      if (existingIdx >= 0) {
        existingMarks[existingIdx] = {
          ...existingMarks[existingIdx],
          marks: {
            ...existingMarks[existingIdx].marks,
            ...row.marks,
          },
          updatedAt: timestamp,
          updatedBy: editorId,
          updatedByName: editorName,
        };
      } else {
        existingMarks.push({
          id: `mark-${row.studentId}-${exam.id}`,
          studentId: row.studentId,
          examId: exam.id,
          marks: row.marks,
          updatedAt: timestamp,
          updatedBy: editorId,
          updatedByName: editorName,
        });
      }
      updatedCount++;
    });

    StorageService.saveMarks(existingMarks);

    // Record Audit Log
    StorageService.addLog({
      performedBy: {
        role: user?.role || 'TEACHER',
        id: user?.teacherId || user?.id || 'SF-USER',
        name: user?.name || 'Authorized Teacher',
      },
      action: 'UPLOAD_BULK_MARKS',
      details: `Bulk marks workbook uploaded for ${updatedCount} students (${exam.name}). Source file: ${fileName}`,
      metadata: {
        examId: exam.id,
        examName: exam.name,
        studentCount: updatedCount,
        fileName,
      },
    });

    onUploadSuccess();
    onClose();
  };

  const totalErrors = parsedRows.reduce((acc, row) => acc + row.errors.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Bulk Marks Upload</h2>
              <p className="text-xs text-slate-400">
                {exam.name} · {students.length} Students in Roster
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Step 1: Download Template */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Step 1: Download Template</div>
              <p className="text-xs text-slate-600 mt-1">
                Get a pre-formatted spreadsheet populated with all {students.length} student names, roll numbers, and examination subject columns.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Step 2: Upload Completed Spreadsheet</div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl p-8 text-center cursor-pointer transition-all"
            >
              <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">
                {fileName ? fileName : 'Click to select or drag and drop your completed marks file'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and standard Comma Separated (.csv) files
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 3: Verification Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Step 3: Verification Preview</span>
                  <span className="text-xs text-slate-500">
                    ({parsedRows.length} students matched)
                  </span>
                </div>
                {totalErrors > 0 ? (
                  <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {totalErrors} validation warning(s) detected
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All records validated successfully
                  </span>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Roll</th>
                      <th className="py-2 px-3">Student Name</th>
                      {exam.subjects.map((sub) => (
                        <th key={sub.id} className="py-2 px-3 text-center">
                          {sub.name} ({sub.maxMarks})
                        </th>
                      ))}
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr key={row.studentId} className={row.errors.length > 0 ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">{row.rollNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{row.name}</td>
                        {exam.subjects.map((sub) => {
                          const entry = row.marks[sub.id];
                          let display = '—';
                          if (entry?.isAbsent) display = 'ABS';
                          else if (entry?.isUnverified) display = 'UNV';
                          else if (entry?.obtained !== undefined && entry?.obtained !== null) {
                            display = String(entry.obtained);
                          }
                          return (
                            <td key={sub.id} className="py-2 px-3 text-center font-mono">
                              {display}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3">
                          {row.errors.length > 0 ? (
                            <span className="text-rose-600 font-medium text-3xs" title={row.errors.join(', ')}>
                              {row.errors[0]}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium text-3xs">Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
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
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleApplyMarks}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${
              parsedRows.length === 0 || isProcessing
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply & Save {parsedRows.length} Student Marks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
