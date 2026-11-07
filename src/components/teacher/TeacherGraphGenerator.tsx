import React, { useState, useMemo } from 'react';
import {
  Teacher,
  SpreadsheetSubject,
  SpreadsheetRow,
  SpreadsheetValidationSummary,
  ValidationErrorItem,
  SubjectGraphItem,
  GraphGenerationRecord,
  SchoolSettings
} from '../../types';
import { StorageService } from '../../utils/storage';
import { ExportService } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';
import { SpreadsheetMarksTable } from './SpreadsheetMarksTable';
import { DataSummaryCard } from './DataSummaryCard';
import { SubjectGraphCard } from './SubjectGraphCard';
import { SpreadsheetImportModal } from './SpreadsheetImportModal';
import { TeacherProfileModal } from './TeacherProfileModal';
import { TeacherGraphHistory } from './TeacherGraphHistory';
import { PdfHeadingModal } from './PdfHeadingModal';
import { ShareReportModal } from '../common/ShareReportModal';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Save,
  CheckCircle,
  AlertCircle,
  User,
  History,
  LogOut,
  Building2,
  Calendar,
  Sparkles,
  Printer,
  Share2
} from 'lucide-react';

interface TeacherGraphGeneratorProps {
  teacher: Teacher;
  onTeacherUpdated?: (t: Teacher) => void;
}

export const TeacherGraphGenerator: React.FC<TeacherGraphGeneratorProps> = ({
  teacher: initialTeacher,
  onTeacherUpdated,
}) => {
  const { logout } = useAuth();
  const [currentTeacher, setCurrentTeacher] = useState<Teacher>(initialTeacher);
  const [schoolSettings] = useState<SchoolSettings>(() => StorageService.getSchoolSettings());

  // Navigation view: 'generator' | 'history'
  const [currentView, setCurrentView] = useState<'generator' | 'history'>('generator');

  // Examination metadata for current working draft
  const [examName, setExamName] = useState('Mid-Term Examination 2026');
  const [academicSession, setAcademicSession] = useState(initialTeacher.academicSession || '2026-2027');
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('published');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Automatically load admin-assigned subjects and maximum marks for this teacher
  const [subjects, setSubjects] = useState<SpreadsheetSubject[]>(() => {
    const assigned = StorageService.getTeacherAssignedSubjects(initialTeacher);
    if (assigned && assigned.length > 0) {
      return assigned.map((sub) => ({
        id: sub.id,
        name: sub.name,
        maxMarks: sub.maxMarks,
      }));
    }
    return [
      { id: 'sub-hindi', name: 'Hindi', maxMarks: 80 },
      { id: 'sub-eng', name: 'English', maxMarks: 80 },
      { id: 'sub-math', name: 'Maths', maxMarks: 80 },
      { id: 'sub-sci', name: 'Science', maxMarks: 80 },
    ];
  });

  // Student rows initialized from real assigned class roster or default sample
  const [rows, setRows] = useState<SpreadsheetRow[]>(() => {
    const classStudents = StorageService.getStudents().filter(
      (s) =>
        s.assignedTeacherId === initialTeacher.teacherId ||
        (s.class === initialTeacher.assignedClass && s.section === initialTeacher.assignedSection)
    );

    if (classStudents.length > 0) {
      return classStudents.map((s) => ({
        id: `row-${s.id}`,
        studentName: s.name,
        rollNumber: s.rollNumber,
        marks: {},
      }));
    }

    return [
      { id: 'row-1', studentName: 'Kartik', marks: { 'sub-hindi': '67', 'sub-eng': '72', 'sub-math': '65', 'sub-sci': '78' } },
      { id: 'row-2', studentName: 'Ananya', marks: { 'sub-hindi': '60', 'sub-eng': '70', 'sub-math': '75', 'sub-sci': '68' } },
      { id: 'row-3', studentName: 'Anjali', marks: { 'sub-hindi': '55', 'sub-eng': '64', 'sub-math': '71', 'sub-sci': '72' } },
      { id: 'row-4', studentName: 'Aarav Sharma', marks: { 'sub-hindi': '74', 'sub-eng': '76', 'sub-math': '78', 'sub-sci': '77' } },
      { id: 'row-5', studentName: 'Aditi Verma', marks: { 'sub-hindi': '68', 'sub-eng': '71', 'sub-math': '70', 'sub-sci': '73' } },
      { id: 'row-6', studentName: 'Akash Patel', marks: { 'sub-hindi': '52', 'sub-eng': '58', 'sub-math': '49', 'sub-sci': '62' } },
      { id: 'row-7', studentName: 'Aryan Gupta', marks: { 'sub-hindi': '64', 'sub-eng': '69', 'sub-math': '72', 'sub-sci': '66' } },
      { id: 'row-8', studentName: 'Bhavna Kulkarni', marks: { 'sub-hindi': '28', 'sub-eng': '35', 'sub-math': '26', 'sub-sci': '31' } },
      { id: 'row-9', studentName: 'Chirag Reddy', marks: { 'sub-hindi': '48', 'sub-eng': '52', 'sub-math': '44', 'sub-sci': '50' } },
      { id: 'row-10', studentName: 'Hardik Pandya', marks: { 'sub-hindi': '38', 'sub-eng': '44', 'sub-math': '36', 'sub-sci': '41' } },
    ];
  });

  // UI state
  const [graphsGenerated, setGraphsGenerated] = useState(true);
  const [savedGraphProject, setSavedGraphProject] = useState<GraphGenerationRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Live Data Validation Summary calculation
  const validationSummary = useMemo<SpreadsheetValidationSummary>(() => {
    let validMarks = 0;
    let missingMarks = 0;
    let invalidEntries = 0;
    let completeStudents = 0;
    let incompleteStudents = 0;
    const errors: ValidationErrorItem[] = [];

    const activeRows = rows.filter((r) => r.studentName.trim());

    activeRows.forEach((r, rowIdx) => {
      let rowMissing = 0;
      let rowInvalid = 0;

      subjects.forEach((sub) => {
        const val = r.marks[sub.id] || '';
        if (!val.trim()) {
          missingMarks++;
          rowMissing++;
          return;
        }

        const isAbsent = /^[Aa]b?(sent)?$/i.test(val);
        if (isAbsent) {
          validMarks++;
          return;
        }

        const num = parseFloat(val);
        if (isNaN(num)) {
          invalidEntries++;
          rowInvalid++;
          errors.push({
            rowIdx,
            studentName: r.studentName,
            subjectName: sub.name,
            subjectId: sub.id,
            cellValue: val,
            reason: `"${val}" is not a valid number or "A" (Absent)`,
          });
        } else if (num < 0) {
          invalidEntries++;
          rowInvalid++;
          errors.push({
            rowIdx,
            studentName: r.studentName,
            subjectName: sub.name,
            subjectId: sub.id,
            cellValue: val,
            reason: `Mark (${num}) cannot be negative`,
          });
        } else if (num > sub.maxMarks) {
          invalidEntries++;
          rowInvalid++;
          errors.push({
            rowIdx,
            studentName: r.studentName,
            subjectName: sub.name,
            subjectId: sub.id,
            cellValue: val,
            reason: `Mark (${num}) exceeds maximum allowed (${sub.maxMarks})`,
          });
        } else {
          validMarks++;
        }
      });

      if (rowMissing === 0 && rowInvalid === 0) {
        completeStudents++;
      } else {
        incompleteStudents++;
      }
    });

    return {
      totalStudents: activeRows.length,
      totalSubjects: subjects.length,
      validMarks,
      missingMarks,
      invalidEntries,
      completeStudents,
      incompleteStudents,
      errors,
    };
  }, [rows, subjects]);

  // Active Subjects & Rows for Graph Rendering
  const activeGraphSubjects = useMemo(() => {
    return savedGraphProject ? savedGraphProject.subjects : subjects;
  }, [savedGraphProject, subjects]);

  const activeGraphRows = useMemo(() => {
    return savedGraphProject ? savedGraphProject.rows : rows;
  }, [savedGraphProject, rows]);

  // Subject-wise graph items calculation sorted in strictly DECREASING percentage order
  const subjectGraphDataMap = useMemo<Record<string, SubjectGraphItem[]>>(() => {
    const map: Record<string, SubjectGraphItem[]> = {};

    activeGraphSubjects.forEach((sub) => {
      const items: SubjectGraphItem[] = activeGraphRows
        .filter((r) => r.studentName.trim())
        .map((r) => {
          const val = r.marks[sub.id] || '';
          const isAbsent = /^[Aa]b?(sent)?$/i.test(val);
          const num = parseFloat(val);
          const isInvalid = !isAbsent && (isNaN(num) || num < 0 || num > sub.maxMarks);
          const marksObtained = !isAbsent && !isInvalid && !isNaN(num) ? num : null;
          const percentage = marksObtained !== null && sub.maxMarks > 0 ? Math.round((marksObtained / sub.maxMarks) * 1000) / 10 : null;

          let band: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'GREY' = 'GREY';
          let bandLabel = isAbsent ? 'Absent' : isInvalid ? 'Invalid' : 'Missing';

          if (percentage !== null) {
            if (percentage > 80) { band = 'GREEN'; bandLabel = 'Above 80%'; }
            else if (percentage >= 60) { band = 'YELLOW'; bandLabel = '60%–80%'; }
            else if (percentage >= 40) { band = 'ORANGE'; bandLabel = '40%–<60%'; }
            else { band = 'RED'; bandLabel = 'Below 40%'; }
          }

          return {
            studentName: r.studentName,
            rollNumber: r.rollNumber,
            marksObtained,
            maxMarks: sub.maxMarks,
            percentage,
            band,
            bandLabel,
            isAbsent,
            isInvalid,
            displayMark: val,
          };
        })
        .sort((a, b) => {
          if (a.percentage !== null && b.percentage !== null) {
            if (a.percentage !== b.percentage) {
              return a.percentage - b.percentage;
            }
            return (a.studentName || '').localeCompare(b.studentName || '');
          }
          if (a.percentage !== null) return -1;
          if (b.percentage !== null) return 1;
          return (a.studentName || '').localeCompare(b.studentName || '');
        });

      map[sub.id] = items;
    });

    return map;
  }, [activeGraphRows, activeGraphSubjects]);

  // Handle Save Marks & Generate Graphs Action
  const handleSaveAndGenerate = () => {
    const filledRows = rows.filter((r) => r.studentName.trim());
    if (filledRows.length === 0) {
      alert('Please enter student names and subject marks before generating graphs.');
      return;
    }

    if (validationSummary.invalidEntries > 0) {
      if (!confirm(`Warning: ${validationSummary.invalidEntries} invalid marks detected. Do you want to proceed and generate graphs anyway?`)) {
        return;
      }
    }

    const projectId = activeProjectId || `proj-${Date.now().toString(36)}`;
    const newProject: GraphGenerationRecord = {
      id: projectId,
      teacherId: currentTeacher.teacherId,
      teacherName: currentTeacher.name,
      teacherDesignation: currentTeacher.designation,
      class: currentTeacher.assignedClass,
      section: currentTeacher.assignedSection,
      examinationName: examName,
      academicSession,
      schoolName: schoolSettings.schoolName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: publishStatus,
      studentCount: filledRows.length,
      subjectCount: subjects.length,
      subjects,
      rows: filledRows,
    };

    // 1. Save to Database
    StorageService.saveGraphProject(newProject);
    setSavedGraphProject(newProject);

    // 2. Audit Log
    StorageService.addLog({
      performedBy: {
        role: 'TEACHER',
        id: currentTeacher.teacherId,
        name: currentTeacher.name,
      },
      action: 'SAVE_GRAPH_PROJECT',
      details: `Saved & generated subject-wise graphs for Class ${currentTeacher.assignedClass} – ${currentTeacher.assignedSection} (${examName}). ${newProject.studentCount} students assessed.`,
      metadata: { projectId, studentCount: newProject.studentCount, status: publishStatus },
    });

    // 3. Show Graphs
    setGraphsGenerated(true);
    setSaveSuccessMsg(true);

    // 4. Automatically Clear Temporary Entry Table
    const freshRows: SpreadsheetRow[] = [
      { id: `row-1-${Date.now()}`, studentName: '', marks: {} },
      { id: `row-2-${Date.now()}`, studentName: '', marks: {} },
      { id: `row-3-${Date.now()}`, studentName: '', marks: {} },
    ];
    setRows(freshRows);
    setActiveProjectId(null);

    // Scroll to Section 3 Graphs
    setTimeout(() => {
      const section3 = document.getElementById('section-3-graphs');
      section3?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Open an existing project from History
  const handleOpenProjectInGenerator = (project: GraphGenerationRecord) => {
    setActiveProjectId(project.id);
    setExamName(project.examinationName);
    setAcademicSession(project.academicSession);
    setPublishStatus(project.status);
    setSubjects(project.subjects);
    setRows(project.rows);
    setGraphsGenerated(true);
    setCurrentView('generator');
  };

  const handleNewExaminationReport = () => {
    setActiveProjectId(null);
    setExamName('Mid-Term Examination 2026');
    setAcademicSession('2025-2026');
    setPublishStatus('published');
    setSubjects([
      { id: 'sub-hindi', name: 'Hindi', maxMarks: 80 },
      { id: 'sub-eng', name: 'English', maxMarks: 80 },
      { id: 'sub-math', name: 'Maths', maxMarks: 80 },
      { id: 'sub-sci', name: 'Science', maxMarks: 80 },
    ]);
    setRows([
      { id: 'row-1', studentName: '', marks: {} },
      { id: 'row-2', studentName: '', marks: {} },
      { id: 'row-3', studentName: '', marks: {} },
    ]);
    setGraphsGenerated(false);
    setCurrentView('generator');
  };

  const handleDownloadCombinedPDF = async (finalExamName: string, finalSession: string) => {
    try {
      setIsGeneratingPdf(true);
      await ExportService.exportCombinedSubjectGraphsPDF(
        {
          schoolName: schoolSettings.schoolName,
          examName: finalExamName,
          academicSession: finalSession,
          className: currentTeacher.assignedClass,
          sectionName: currentTeacher.assignedSection,
          teacherName: currentTeacher.name,
          teacherId: currentTeacher.teacherId,
          teacherDesignation: currentTeacher.designation,
        },
        subjects,
        subjectGraphDataMap
      );
    } catch (err) {
      console.error('Failed to generate combined PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (currentView === 'history') {
    return (
      <TeacherGraphHistory
        currentTeacher={currentTeacher}
        onOpenProjectInGenerator={handleOpenProjectInGenerator}
        onNewExaminationReport={handleNewExaminationReport}
        onBackToGenerator={() => setCurrentView('generator')}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. TEACHER GRAPH GENERATOR HOME HEADER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle Decorative Backdrop */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 p-2 border border-white/20 backdrop-blur-xs shrink-0 hidden sm:flex items-center justify-center">
              <img
                src="/assets/aistudio/surevin_babe9959.jpg"
                alt="Surevin Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-2xs font-bold tracking-wide uppercase text-blue-200 border border-white/10 mb-2">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Surevin International Residential School · Niwari Modinagar</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                MY GRAPH GENERATOR
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl font-medium">
                Enter marks in an Excel-style sheet, upload Excel files, and automatically generate subject-wise student performance graphs.
              </p>
            </div>
          </div>

          {/* Header Action Buttons (Matching Prompt Section 1) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl transition-all cursor-pointer backdrop-blur-md"
            >
              <User className="w-4 h-4" />
              <span>Edit Teacher Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('history')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl transition-all cursor-pointer backdrop-blur-md"
            >
              <History className="w-4 h-4" />
              <span>My Graph History</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Teacher Identity & Assigned Class Badge Card */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-3xs uppercase font-semibold text-blue-200 block">Teacher Name</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{currentTeacher.name}</span>
          </div>

          <div>
            <span className="text-3xs uppercase font-semibold text-blue-200 block">Assigned Class & Section</span>
            <span className="font-bold text-white text-sm mt-0.5 block">
              Class {currentTeacher.assignedClass} – {currentTeacher.assignedSection}
            </span>
          </div>

          <div>
            <span className="text-3xs uppercase font-semibold text-blue-200 block">Teacher ID</span>
            <span className="font-mono font-bold text-amber-300 text-sm mt-0.5 block">
              {currentTeacher.teacherId}
            </span>
          </div>

          <div>
            <span className="text-3xs uppercase font-semibold text-blue-200 block">Designation</span>
            <span className="font-medium text-white text-xs mt-0.5 truncate block">
              {currentTeacher.designation || 'Senior Secondary Teacher'}
            </span>
          </div>

          <div>
            <span className="text-3xs uppercase font-semibold text-blue-200 block">School Entity</span>
            <span className="font-medium text-blue-100 text-xs mt-0.5 truncate block" title={schoolSettings.schoolName}>
              {schoolSettings.schoolName}
            </span>
          </div>
        </div>
      </div>

      {/* Examination Name & Session Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="w-full sm:w-auto flex-1 min-w-[240px]">
              <label className="block text-2xs uppercase tracking-wider font-bold text-slate-500 mb-1">
                Active Examination Title
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Mid-Term Examination 2026"
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500"
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-2xs uppercase tracking-wider font-bold text-slate-500 mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={academicSession}
                onChange={(e) => setAcademicSession(e.target.value)}
                placeholder="2025-2026"
                className="w-full px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500"
              />
            </div>

            <div className="w-full sm:w-40">
              <label className="block text-2xs uppercase tracking-wider font-bold text-slate-500 mb-1">
                Report Status
              </label>
              <select
                value={publishStatus}
                onChange={(e) => setPublishStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500"
              >
                <option value="published">Published (Reports Active)</option>
                <option value="draft">Draft (Work in Progress)</option>
              </select>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xs text-slate-400 block font-semibold uppercase">Scope</span>
            <span className="text-xs font-bold text-slate-800">
              Class {currentTeacher.assignedClass} – {currentTeacher.assignedSection}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SECTION 1 — UPLOAD OR PREPARE MARKS (EXCEL-STYLE SPREADSHEET TABLE) */}
      <SpreadsheetMarksTable
        subjects={subjects}
        rows={rows}
        onSubjectsChange={setSubjects}
        onRowsChange={setRows}
        validationErrors={validationSummary.errors}
        onOpenUploadModal={() => setIsImportModalOpen(true)}
        onDownloadTemplate={() => ExportService.export50StudentExcelTemplate(subjects)}
      />

      {/* 5. SECTION 2 — DATA VALIDATION & SUMMARY */}
      <DataSummaryCard
        summary={validationSummary}
        onScrollToTable={() => {
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
      />

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Marks saved successfully! Your graphs have been generated. The entry table is ready for new data.</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(false)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-emerald-800/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 6. SAVE MARKS AND GENERATE GRAPHS (PROMINENT ACTION BUTTON) */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">Ready to Generate Subject Performance Graphs?</h3>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {validationSummary.totalStudents} Students Assessed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Validates entries, calculates subject percentages, sorts in decreasing order, and saves to teacher history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccessMsg && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle className="w-4 h-4" />
              <span>Saved & Generated!</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveAndGenerate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <BarChart3 className="w-4 h-4" />
            <span>SAVE MARKS & GENERATE GRAPHS</span>
          </button>
        </div>
      </div>

      {/* 7. SECTION 3 — SUBJECT-WISE GRAPHS */}
      {graphsGenerated && (
        <div id="section-3-graphs" className="space-y-6 pt-2">
          {/* Section 3 Header Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Section 3 — Subject-Wise Graphs
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                One graph per subject. Students independently sorted in decreasing order (highest percentage on left, lowest on right).
              </p>
            </div>

            {/* Export Toolbar for Graphs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 rounded-xl transition-all shadow-md shadow-blue-700/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>PRINT / SAVE ALL GRAPHS AS PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                title="Share report directly on WhatsApp, Email, Instagram, Telegram, Facebook"
              >
                <Share2 className="w-4 h-4" />
                <span>SHARE REPORT</span>
              </button>

              <button
                type="button"
                onClick={() => ExportService.exportMarksSpreadsheet(subjects, rows, examName, 'xlsx')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
                title="Download current marks as Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Download Excel</span>
              </button>

              <button
                type="button"
                onClick={() => ExportService.exportMarksSpreadsheet(subjects, rows, examName, 'csv')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Download current marks as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* Color Legend Card (Matching Section 10 specs) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-2xs">
              ScoreFuture Performance Zones:
            </span>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-3 h-3 rounded-xs bg-rose-500 shadow-2xs" /> Red: Below 40%
              </span>
              <span className="flex items-center gap-1.5 text-orange-700">
                <span className="w-3 h-3 rounded-xs bg-orange-500 shadow-2xs" /> Orange: 40%–below 60%
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-3 rounded-xs bg-amber-400 shadow-2xs" /> Yellow: 60%–80%
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 shadow-2xs" /> Green: Above 80%
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-slate-400 shadow-2xs" /> Grey: Missing/Invalid
              </span>
            </div>
          </div>

          {/* Subject Graphs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subjects.map((sub) => {
              const items = subjectGraphDataMap[sub.id] || [];
              return (
                <SubjectGraphCard
                  key={sub.id}
                  subject={sub}
                  items={items}
                  meta={{
                    schoolName: schoolSettings.schoolName,
                    examinationName: examName,
                    academicSession,
                    className: currentTeacher.assignedClass,
                    sectionName: currentTeacher.assignedSection,
                    teacherName: currentTeacher.name,
                    teacherId: currentTeacher.teacherId,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* MODALS */}
      {isImportModalOpen && (
        <SpreadsheetImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          currentSubjects={subjects}
          onImportConfirmed={(newSubs, newRows) => {
            setSubjects(newSubs);
            setRows(newRows);
            setGraphsGenerated(true);
          }}
        />
      )}

      {isProfileModalOpen && (
        <TeacherProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onNavigateToHistory={() => {
            setIsProfileModalOpen(false);
            setCurrentView('history');
          }}
          teacher={currentTeacher}
          onProfileUpdated={(updated) => {
            setCurrentTeacher(updated);
            if (onTeacherUpdated) onTeacherUpdated(updated);
          }}
        />
      )}

      {isPdfModalOpen && (
        <PdfHeadingModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          defaultExamName={examName}
          defaultSession={academicSession}
          schoolSettings={schoolSettings}
          teacher={currentTeacher}
          onConfirmDownload={handleDownloadCombinedPDF}
        />
      )}

      {isShareModalOpen && (
        <ShareReportModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          reportTitle={`Surevin_Graphs_Class_${currentTeacher.assignedClass}_${currentTeacher.assignedSection}.pdf`}
          className={`Class ${currentTeacher.assignedClass} – ${currentTeacher.assignedSection}`}
          examName={examName}
          teacherName={currentTeacher.name}
          onDownloadPdf={() => {
            setIsShareModalOpen(false);
            setIsPdfModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
