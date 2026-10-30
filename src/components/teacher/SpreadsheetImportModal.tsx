import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { SpreadsheetSubject, SpreadsheetRow } from '../../types';
import { Upload, FileSpreadsheet, Check, AlertTriangle, AlertCircle, X, HelpCircle } from 'lucide-react';

interface SpreadsheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubjects: SpreadsheetSubject[];
  onImportConfirmed: (subjects: SpreadsheetSubject[], rows: SpreadsheetRow[]) => void;
}

interface DetectedSubject {
  name: string;
  columnKey: string;
  maxMarks: number;
}

export const SpreadsheetImportModal: React.FC<SpreadsheetImportModalProps> = ({
  isOpen,
  onClose,
  currentSubjects,
  onImportConfirmed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [detectedSubjects, setDetectedSubjects] = useState<DetectedSubject[]>([]);
  const [parsedRows, setParsedRows] = useState<{ studentName: string; marks: Record<string, string>; hasError: boolean; errorMsg?: string }[]>([]);
  const [duplicateNames, setDuplicateNames] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Read raw 2D array to inspect headers & potential Max Marks row
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawGrid || rawGrid.length === 0) {
          setErrorMsg('Uploaded file is empty.');
          setIsProcessing(false);
          return;
        }

        // 1. Identify header row (looks for "Student Name" or "Name")
        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(5, rawGrid.length); r++) {
          const row = rawGrid[r] || [];
          if (row.some((cell: any) => typeof cell === 'string' && /student\s*name|name|student/i.test(cell))) {
            headerRowIdx = r;
            break;
          }
        }

        if (headerRowIdx === -1) {
          headerRowIdx = 0; // fallback to row 0
        }

        const headers = (rawGrid[headerRowIdx] || []).map((h: any) => String(h || '').trim());
        const studentNameColIdx = headers.findIndex((h) => /student\s*name|name/i.test(h));
        const actualNameIdx = studentNameColIdx !== -1 ? studentNameColIdx : 0;

        // 2. Check if the immediately following row defines Maximum Marks
        let maxMarksRowIdx = -1;
        const potentialMaxRow = rawGrid[headerRowIdx + 1];
        if (potentialMaxRow) {
          const cell0 = String(potentialMaxRow[actualNameIdx] || '').trim();
          if (/max\s*marks|maximum\s*marks|max/i.test(cell0) || (!cell0 && potentialMaxRow.some((c: any) => typeof c === 'number' && c > 0))) {
            maxMarksRowIdx = headerRowIdx + 1;
          }
        }

        // 3. Extract Subject Columns
        const subjectsFound: DetectedSubject[] = [];
        headers.forEach((h, colIdx) => {
          if (colIdx === actualNameIdx || !h) return;

          let maxMarks = 80; // default
          // Check if max marks is in the header like "Maths (100)" or "Science [80]"
          const headerMatch = h.match(/[\(\[]\s*max\s*(\d+)\s*[\)\]]|[\(\[]\s*(\d+)\s*[\)\]]/i);
          if (headerMatch) {
            maxMarks = parseInt(headerMatch[1] || headerMatch[2], 10);
          } else if (maxMarksRowIdx !== -1) {
            const rowVal = potentialMaxRow[colIdx];
            const parsed = parseFloat(rowVal);
            if (!isNaN(parsed) && parsed > 0) {
              maxMarks = parsed;
            }
          }

          // Clean up subject name
          const cleanName = h.replace(/[\(\[].*?[\)\]]/g, '').trim();
          subjectsFound.push({
            name: cleanName || `Subject ${colIdx}`,
            columnKey: h,
            maxMarks,
          });
        });

        if (subjectsFound.length === 0) {
          setErrorMsg('No subject columns detected in spreadsheet. Please verify columns.');
          setIsProcessing(false);
          return;
        }

        // 4. Parse Student Rows
        const startRow = maxMarksRowIdx !== -1 ? maxMarksRowIdx + 1 : headerRowIdx + 1;
        const rows: { studentName: string; marks: Record<string, string>; hasError: boolean; errorMsg?: string }[] = [];
        const seenNames = new Set<string>();
        const dupes: string[] = [];

        for (let r = startRow; r < rawGrid.length; r++) {
          const rowData = rawGrid[r];
          if (!rowData || rowData.length === 0) continue;

          const sName = String(rowData[actualNameIdx] || '').trim();
          if (!sName) continue; // skip blank name rows

          // Duplicate check
          const lowerName = sName.toLowerCase();
          if (seenNames.has(lowerName)) {
            dupes.push(sName);
          } else {
            seenNames.add(lowerName);
          }

          const studentMarks: Record<string, string> = {};
          let rowHasError = false;
          let rowErrorMsg = '';

          subjectsFound.forEach((sub, sIdx) => {
            const colIdx = headers.indexOf(sub.columnKey);
            const val = colIdx !== -1 ? rowData[colIdx] : '';
            const strVal = val !== undefined && val !== null ? String(val).trim() : '';

            studentMarks[sub.name] = strVal;

            if (strVal && !/^[Aa]b?(sent)?$/i.test(strVal)) {
              const num = parseFloat(strVal);
              if (isNaN(num)) {
                rowHasError = true;
                rowErrorMsg = `Invalid mark "${strVal}" in ${sub.name}`;
              } else if (num < 0 || num > sub.maxMarks) {
                rowHasError = true;
                rowErrorMsg = `${sub.name} mark (${num}) exceeds maximum allowed (${sub.maxMarks})`;
              }
            }
          });

          rows.push({
            studentName: sName,
            marks: studentMarks,
            hasError: rowHasError,
            errorMsg: rowErrorMsg,
          });
        }

        if (rows.length === 0) {
          setErrorMsg('No valid student rows found in the file.');
          setIsProcessing(false);
          return;
        }

        setDetectedSubjects(subjectsFound);
        setParsedRows(rows);
        setDuplicateNames(Array.from(new Set(dupes)));
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Failed to parse file. Please verify file format (.xlsx, .xls, .csv).');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleMaxMarksChange = (idx: number, newMax: number) => {
    setDetectedSubjects((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], maxMarks: Math.max(1, newMax) };
      return copy;
    });
  };

  const handleConfirm = () => {
    // Generate new SpreadsheetSubject items
    const newSubjects: SpreadsheetSubject[] = detectedSubjects.map((s, idx) => ({
      id: `sub-import-${idx}-${Date.now().toString(36)}`,
      name: s.name,
      maxMarks: s.maxMarks,
    }));

    // Map rows to new subject IDs
    const newRows: SpreadsheetRow[] = parsedRows.map((r, idx) => {
      const marksMap: Record<string, string> = {};
      newSubjects.forEach((sub, sIdx) => {
        const origSubName = detectedSubjects[sIdx].name;
        marksMap[sub.id] = r.marks[origSubName] || '';
      });

      return {
        id: `row-import-${idx}-${Date.now().toString(36)}`,
        studentName: r.studentName,
        marks: marksMap,
      };
    });

    onImportConfirmed(newSubjects, newRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Upload & Import Marks (Excel / CSV)</h2>
              <p className="text-xs text-blue-100">
                Inspect preview, confirm maximum marks, and map student columns
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* File Picker Zone */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-600 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-800">
                {fileName ? fileName : 'Click here to choose your Excel (.xlsx, .xls) or CSV file'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Reads student names, subject columns, and maximum marks automatically.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {duplicateNames.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>Duplicate Student Warning:</strong> The file contains duplicate student name(s): {duplicateNames.join(', ')}. Please review rows before importing.
              </div>
            </div>
          )}

          {/* Detected Subjects & Maximum Marks Editor */}
          {detectedSubjects.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Detected Subjects & Maximum Marks (Confirm or Edit):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {detectedSubjects.map((sub, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-xs font-bold text-slate-800 truncate" title={sub.name}>
                      {sub.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-3xs text-slate-500">Max Marks:</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={sub.maxMarks}
                        onChange={(e) => handleMaxMarksChange(idx, Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-center border border-slate-300 rounded bg-amber-50/70"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Import Preview ({parsedRows.length} Students Detected)
                </span>
                <span className="text-2xs text-slate-500">
                  {detectedSubjects.length} subjects found
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Student Name</th>
                      {detectedSubjects.map((sub, idx) => (
                        <th key={idx} className="py-2 px-3 text-center">
                          {sub.name} (Max {sub.maxMarks})
                        </th>
                      ))}
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={r.hasError ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.studentName}</td>
                        {detectedSubjects.map((sub, sIdx) => (
                          <td key={sIdx} className="py-2 px-3 text-center font-mono font-medium text-slate-700">
                            {r.marks[sub.name] || '—'}
                          </td>
                        ))}
                        <td className="py-2 px-3">
                          {r.hasError ? (
                            <span className="text-3xs font-semibold text-rose-600" title={r.errorMsg}>
                              {r.errorMsg}
                            </span>
                          ) : (
                            <span className="text-3xs font-semibold text-emerald-600">Valid</span>
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

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
              parsedRows.length === 0 || isProcessing
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-700 shadow-xs'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Accept & Import {parsedRows.length} Students</span>
          </button>
        </div>
      </div>
    </div>
  );
};
