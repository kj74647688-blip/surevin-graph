import React, { useState } from 'react';
import { GraphGenerationRecord, Teacher, SchoolSettings, SubjectGraphItem } from '../../types';
import { StorageService } from '../../utils/storage';
import { ExportService } from '../../utils/exportUtils';
import { PERFORMANCE_COLORS } from '../../utils/constants';
import { SubjectGraphCard } from './SubjectGraphCard';
import {
  History,
  FileSpreadsheet,
  Download,
  FolderOpen,
  Calendar,
  CheckCircle,
  FileText,
  Clock,
  Trash2,
  Eye,
  Plus,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Search
} from 'lucide-react';

interface TeacherGraphHistoryProps {
  currentTeacher?: Teacher; // if undefined, admin view
  onOpenProjectInGenerator: (project: GraphGenerationRecord) => void;
  onNewExaminationReport: () => void;
  onBackToGenerator?: () => void;
}

export const TeacherGraphHistory: React.FC<TeacherGraphHistoryProps> = ({
  currentTeacher,
  onOpenProjectInGenerator,
  onNewExaminationReport,
  onBackToGenerator,
}) => {
  const [projects, setProjects] = useState<GraphGenerationRecord[]>(() => StorageService.getGraphProjects());
  const [schoolSettings] = useState<SchoolSettings>(() => StorageService.getSchoolSettings());
  const [selectedProjectForPreview, setSelectedProjectForPreview] = useState<GraphGenerationRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'published'>('ALL');

  const reloadProjects = () => {
    setProjects(StorageService.getGraphProjects());
  };

  // Filter: if teacher, only show their projects. If admin, show all
  const filteredProjects = projects.filter((p) => {
    if (currentTeacher && p.teacherId !== currentTeacher.teacherId) {
      return false;
    }

    const matchesSearch =
      p.examinationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.teacherName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, examName: string) => {
    if (confirm(`Are you sure you want to delete the examination graph record for "${examName}"?`)) {
      StorageService.deleteGraphProject(id);
      StorageService.addLog({
        performedBy: {
          role: currentTeacher ? 'TEACHER' : 'ADMIN',
          id: currentTeacher?.teacherId || 'SF-ADM-001',
          name: currentTeacher?.name || 'Administrator',
        },
        action: 'DELETE_GRAPH_PROJECT',
        details: `Deleted examination graph record "${examName}" (ID: ${id}).`,
      });
      reloadProjects();
      if (selectedProjectForPreview?.id === id) {
        setSelectedProjectForPreview(null);
      }
    }
  };

  const handleDownloadPDF = (project: GraphGenerationRecord) => {
    // Generate graph item data map
    const subjectGraphMap: Record<string, SubjectGraphItem[]> = {};

    project.subjects.forEach((sub) => {
      const items: SubjectGraphItem[] = project.rows
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
          if (a.percentage !== null && b.percentage !== null) return b.percentage - a.percentage;
          if (a.percentage !== null) return -1;
          if (b.percentage !== null) return 1;
          return a.studentName.localeCompare(b.studentName);
        });

      subjectGraphMap[sub.id] = items;
    });

    ExportService.exportCombinedSubjectGraphsPDF(
      {
        schoolName: project.schoolName || schoolSettings.schoolName,
        examName: project.examinationName,
        academicSession: project.academicSession,
        className: project.class,
        sectionName: project.section,
        teacherName: project.teacherName,
        teacherId: project.teacherId,
        teacherDesignation: project.teacherDesignation,
      },
      project.subjects,
      subjectGraphMap
    );
  };

  const handleDownloadExcel = (project: GraphGenerationRecord, format: 'xlsx' | 'csv') => {
    ExportService.exportMarksSpreadsheet(project.subjects, project.rows, project.examinationName, format);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {onBackToGenerator && (
                <button
                  type="button"
                  onClick={onBackToGenerator}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer mr-1"
                  title="Back to Graph Generator"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="p-2 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-xl shadow-xs">
                <History className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentTeacher ? 'My Graph History' : 'All School Teacher Graph Projects'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Persistent records of saved examinations, spreadsheet marks, and generated subject-wise graphs.
            </p>
          </div>

          <button
            type="button"
            onClick={onNewExaminationReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Examination Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search examination, class, session..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-2xs font-semibold text-slate-400 uppercase">Status:</span>
          {(['ALL', 'draft', 'published'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-2xs font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Records' : st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* History Records List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Graph Projects Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Save your marks in the spreadsheet and click "SAVE MARKS & GENERATE GRAPHS" to automatically save persistent reports here.
            </p>
            <button
              type="button"
              onClick={onNewExaminationReport}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
            >
              Go to Graph Generator
            </button>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Project Meta */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{proj.examinationName}</h3>
                  <span
                    className={`text-3xs font-bold px-2 py-0.5 rounded-full uppercase border ${
                      proj.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    {proj.status}
                  </span>
                  <span className="text-3xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Session {proj.academicSession}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
                  <span className="font-semibold text-slate-900">Class {proj.class} – {proj.section}</span>
                  <span>·</span>
                  <span>{proj.studentCount} Students</span>
                  <span>·</span>
                  <span>{proj.subjectCount} Subjects ({proj.subjects.map((s) => s.name).join(', ')})</span>
                  <span>·</span>
                  <span className="text-slate-400">
                    Saved: {new Date(proj.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {!currentTeacher && (
                  <div className="text-2xs text-indigo-700 font-medium">
                    Managed by Teacher: <strong>{proj.teacherName}</strong> ({proj.teacherId})
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Open & Edit in Generator */}
                <button
                  type="button"
                  onClick={() => onOpenProjectInGenerator(proj)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                  title="Load into spreadsheet editor"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open & Edit Draft</span>
                </button>

                {/* View Graphs */}
                <button
                  type="button"
                  onClick={() => setSelectedProjectForPreview(selectedProjectForPreview?.id === proj.id ? null : proj)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedProjectForPreview?.id === proj.id ? 'Hide Graphs' : 'View Graphs'}</span>
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(proj)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Download combined landscape PDF"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>All Graphs PDF</span>
                </button>

                {/* Download Excel */}
                <button
                  type="button"
                  onClick={() => handleDownloadExcel(proj, 'xlsx')}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                  title="Download marks Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(proj.id, proj.examinationName)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expanded Subject Graphs Preview */}
      {selectedProjectForPreview && (
        <div className="bg-slate-100/70 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Subject-Wise Graphs Preview: {selectedProjectForPreview.examinationName}
              </h3>
              <p className="text-xs text-slate-500">
                Class {selectedProjectForPreview.class} – {selectedProjectForPreview.section} · {selectedProjectForPreview.subjects.length} Subjects
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProjectForPreview(null)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close Preview
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {selectedProjectForPreview.subjects.map((sub) => {
              const items: SubjectGraphItem[] = selectedProjectForPreview.rows
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
                  if (a.percentage !== null && b.percentage !== null) return b.percentage - a.percentage;
                  if (a.percentage !== null) return -1;
                  if (b.percentage !== null) return 1;
                  return a.studentName.localeCompare(b.studentName);
                });

              return (
                <SubjectGraphCard
                  key={sub.id}
                  subject={sub}
                  items={items}
                  meta={{
                    schoolName: selectedProjectForPreview.schoolName || schoolSettings.schoolName,
                    examinationName: selectedProjectForPreview.examinationName,
                    academicSession: selectedProjectForPreview.academicSession,
                    className: selectedProjectForPreview.class,
                    sectionName: selectedProjectForPreview.section,
                    teacherName: selectedProjectForPreview.teacherName,
                    teacherId: selectedProjectForPreview.teacherId,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
