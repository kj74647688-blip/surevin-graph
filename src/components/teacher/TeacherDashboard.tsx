import React, { useState, useMemo } from 'react';
import {
  StudentRecord,
  Examination,
  StudentMarksRecord,
  Teacher
} from '../../types';
import { StorageService } from '../../utils/storage';
import { ExportService } from '../../utils/exportUtils';
import {
  calculateSubjectPerformance,
  PERFORMANCE_COLORS
} from '../../utils/constants';
import { StudentSubjectGraph } from '../graphs/StudentSubjectGraph';
import { ClassSubjectGraph } from '../graphs/ClassSubjectGraph';
import { BulkUploadModal } from './BulkUploadModal';
import { StudentMarksModal } from './StudentMarksModal';
import { AddStudentModal } from './AddStudentModal';
import { StudentReportCardModal } from '../reports/StudentReportCardModal';
import {
  Users,
  BarChart3,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Award,
  AlertTriangle,
  TrendingUp,
  Edit3,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface TeacherDashboardProps {
  currentTeacher: Teacher;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentTeacher }) => {
  // Data state
  const [students, setStudents] = useState<StudentRecord[]>(() => StorageService.getStudents());
  const [exams, setExams] = useState<Examination[]>(() => StorageService.getExams());
  const [marksList, setMarksList] = useState<StudentMarksRecord[]>(() => StorageService.getMarks());
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || 'exam-midterm-2026');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [bandFilter, setBandFilter] = useState<'ALL' | 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'GREY'>('ALL');
  const [activeTab, setActiveTab] = useState<'roster' | 'graphs' | 'class-analytics' | 'history'>('roster');

  // Modals state
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);

  const reloadData = () => {
    setStudents(StorageService.getStudents());
    setMarksList(StorageService.getMarks());
    setExams(StorageService.getExams());
  };

  // Filter students strictly belonging to this teacher's assigned class & section
  const assignedStudents = useMemo(() => {
    return students.filter(
      (s) =>
        (s.class === currentTeacher.assignedClass && s.section === currentTeacher.assignedSection) ||
        s.assignedTeacherId === currentTeacher.teacherId
    );
  }, [students, currentTeacher]);

  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  // Compute metrics for the class
  const classMetrics = useMemo(() => {
    let totalScore = 0;
    let totalCount = 0;
    let greenCount = 0;
    let yellowCount = 0;
    let orangeCount = 0;
    let redCount = 0;
    let greyCount = 0;
    let topScore = -1;
    let topperName = '—';

    assignedStudents.forEach((stu) => {
      const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === currentExam.id);
      let studentObt = 0;
      let studentMax = 0;

      currentExam.subjects.forEach((sub) => {
        const entry = marksRec?.marks?.[sub.id];
        const perf = calculateSubjectPerformance(sub, entry);
        if (perf.obtained !== null && !perf.isAbsent && !perf.isUnverified) {
          studentObt += perf.obtained;
          studentMax += sub.maxMarks;
        }
      });

      if (studentMax > 0) {
        const pct = Math.round((studentObt / studentMax) * 1000) / 10;
        totalScore += pct;
        totalCount++;

        if (pct > topScore) {
          topScore = pct;
          topperName = stu.name;
        }

        if (pct > 80) greenCount++;
        else if (pct >= 60) yellowCount++;
        else if (pct >= 40) orangeCount++;
        else redCount++;
      } else {
        greyCount++;
      }
    });

    const averagePercent = totalCount > 0 ? Math.round((totalScore / totalCount) * 10) / 10 : 0;

    return {
      averagePercent,
      topScore: topScore >= 0 ? topScore : 0,
      topperName,
      greenCount,
      yellowCount,
      orangeCount,
      redCount,
      greyCount,
      totalStudents: assignedStudents.length,
    };
  }, [assignedStudents, marksList, currentExam]);

  // Filtered student list for display
  const filteredStudents = useMemo(() => {
    return assignedStudents.filter((stu) => {
      const matchesSearch =
        stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stu.rollNumber.includes(searchQuery);

      if (!matchesSearch) return false;
      if (bandFilter === 'ALL') return true;

      // Check student overall band
      const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === currentExam.id);
      let obt = 0;
      let max = 0;
      currentExam.subjects.forEach((sub) => {
        const entry = marksRec?.marks?.[sub.id];
        const perf = calculateSubjectPerformance(sub, entry);
        if (perf.obtained !== null && !perf.isAbsent && !perf.isUnverified) {
          obt += perf.obtained;
          max += sub.maxMarks;
        }
      });

      if (max === 0) return bandFilter === 'GREY';
      const pct = (obt / max) * 100;
      if (pct > 80) return bandFilter === 'GREEN';
      if (pct >= 60) return bandFilter === 'YELLOW';
      if (pct >= 40) return bandFilter === 'ORANGE';
      return bandFilter === 'RED';
    });
  }, [assignedStudents, searchQuery, bandFilter, marksList, currentExam]);

  const handleDownloadClassPDF = () => {
    ExportService.exportClassPDF(
      assignedStudents,
      marksList,
      currentExam,
      currentTeacher.assignedClass,
      currentTeacher.assignedSection,
      currentTeacher
    );
  };

  const handleDownloadClassExcel = () => {
    ExportService.exportClassExcelWorkbook(
      assignedStudents,
      marksList,
      currentExam,
      currentTeacher.assignedClass,
      currentTeacher.assignedSection,
      currentTeacher.name
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Teacher & Assigned Class Profile */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              {currentTeacher.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {currentTeacher.name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                  {currentTeacher.teacherId}
                </span>
                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium">
                  Authorized Teacher
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">
                  Assigned Class: Class {currentTeacher.assignedClass} – {currentTeacher.assignedSection}
                </span>
                <span>·</span>
                <span>{assignedStudents.length} Academic Student Records</span>
                <span>·</span>
                <span>Session 2025-2026</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Add Student</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBulkUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Marks (Excel/CSV)</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

            <button
              type="button"
              onClick={handleDownloadClassPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Download Complete Class Graph PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Class PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadClassExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
              title="Download Excel Marks Workbook"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Marks Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Examination Selector & Key Class Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Exam Picker Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <label className="text-2xs uppercase tracking-wider font-bold text-slate-500 block mb-1">
              Active Examination
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.subjects.length} Subjects)
                </option>
              ))}
            </select>
          </div>
          <div className="text-2xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Session: {currentExam.academicSession}</span>
            <span className="capitalize font-medium text-emerald-600">● {currentExam.status}</span>
          </div>
        </div>

        {/* Metric 1: Class Average */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-2xs uppercase tracking-wider font-bold">Class Average</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {classMetrics.averagePercent}%
          </div>
          <div className="text-2xs text-slate-500 mt-1">
            Across {currentExam.subjects.length} subjects ({classMetrics.totalStudents} students)
          </div>
        </div>

        {/* Metric 2: Class Topper */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-2xs uppercase tracking-wider font-bold">Top Performer</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-bold text-slate-900 mt-1 truncate" title={classMetrics.topperName}>
            {classMetrics.topperName}
          </div>
          <div className="text-2xs text-emerald-600 font-mono font-bold mt-1">
            {classMetrics.topScore}% Aggregate Score
          </div>
        </div>

        {/* Metric 3: ScoreFuture 4-Band Summary */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div className="text-2xs uppercase tracking-wider font-bold text-slate-500 mb-1">
            Performance Spectrum
          </div>
          <div className="flex items-center gap-1.5 h-6">
            <div
              style={{ width: `${Math.max(8, (classMetrics.greenCount / classMetrics.totalStudents) * 100)}%` }}
              className="bg-emerald-500 h-full rounded-xs flex items-center justify-center text-3xs text-white font-bold"
              title={`Green (>80%): ${classMetrics.greenCount} students`}
            >
              {classMetrics.greenCount}
            </div>
            <div
              style={{ width: `${Math.max(8, (classMetrics.yellowCount / classMetrics.totalStudents) * 100)}%` }}
              className="bg-amber-400 h-full rounded-xs flex items-center justify-center text-3xs text-slate-900 font-bold"
              title={`Yellow (60-80%): ${classMetrics.yellowCount} students`}
            >
              {classMetrics.yellowCount}
            </div>
            <div
              style={{ width: `${Math.max(8, (classMetrics.orangeCount / classMetrics.totalStudents) * 100)}%` }}
              className="bg-orange-500 h-full rounded-xs flex items-center justify-center text-3xs text-white font-bold"
              title={`Orange (40-60%): ${classMetrics.orangeCount} students`}
            >
              {classMetrics.orangeCount}
            </div>
            <div
              style={{ width: `${Math.max(8, (classMetrics.redCount / classMetrics.totalStudents) * 100)}%` }}
              className="bg-rose-500 h-full rounded-xs flex items-center justify-center text-3xs text-white font-bold"
              title={`Red (<40%): ${classMetrics.redCount} students`}
            >
              {classMetrics.redCount}
            </div>
          </div>
          <div className="flex justify-between text-3xs text-slate-400 mt-1 font-mono">
            <span className="text-emerald-600">Green: {classMetrics.greenCount}</span>
            <span className="text-amber-600">Yellow: {classMetrics.yellowCount}</span>
            <span className="text-orange-600">Orange: {classMetrics.orangeCount}</span>
            <span className="text-rose-600">Red: {classMetrics.redCount}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'roster'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Roster & Marks ({assignedStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('graphs')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'graphs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Subject-Wise Student Graphs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('class-analytics')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'class-analytics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Class-Wide Analytics & Curves
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit History & Upload Logs
          </button>
        </div>
      </div>

      {/* Tab Content 1: Student Roster & Marks */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or roll #..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Performance Band Filters */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 text-2xs mr-1 font-semibold uppercase">Filter Band:</span>
              {(['ALL', 'GREEN', 'YELLOW', 'ORANGE', 'RED'] as const).map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setBandFilter(band)}
                  className={`px-2.5 py-1 rounded-md text-2xs font-bold transition-colors cursor-pointer ${
                    bandFilter === band
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {band === 'ALL' ? 'All' : band === 'GREEN' ? '>80%' : band === 'YELLOW' ? '60-80%' : band === 'ORANGE' ? '40-60%' : '<40%'}
                </button>
              ))}
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-3xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  {currentExam.subjects.map((sub) => (
                    <th key={sub.id} className="py-3 px-3 text-center">
                      {sub.code} ({sub.maxMarks})
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center">Total</th>
                  <th className="py-3 px-3 text-center">Score %</th>
                  <th className="py-3 px-4 text-center">Band</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={currentExam.subjects.length + 6} className="py-8 text-center text-slate-400 text-xs">
                      No matching student academic records found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu) => {
                    const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === currentExam.id);
                    let studentObt = 0;
                    let studentMax = 0;
                    let hasEvaluated = false;

                    const subjectCells = currentExam.subjects.map((sub) => {
                      const entry = marksRec?.marks?.[sub.id];
                      const perf = calculateSubjectPerformance(sub, entry);
                      if (perf.obtained !== null && !perf.isAbsent && !perf.isUnverified) {
                        studentObt += perf.obtained;
                        studentMax += sub.maxMarks;
                        hasEvaluated = true;
                      }

                      let display = '—';
                      let colorClass = 'text-slate-400';
                      if (perf.isAbsent) {
                        display = 'ABS';
                        colorClass = 'text-rose-600 font-bold';
                      } else if (perf.isUnverified || perf.obtained === null) {
                        display = '—';
                        colorClass = 'text-slate-400';
                      } else {
                        display = String(perf.obtained);
                        if (perf.band === 'GREEN') colorClass = 'text-emerald-700 font-bold';
                        else if (perf.band === 'YELLOW') colorClass = 'text-amber-700 font-semibold';
                        else if (perf.band === 'ORANGE') colorClass = 'text-orange-700';
                        else colorClass = 'text-rose-600 font-bold';
                      }

                      return (
                        <td key={sub.id} className={`py-3 px-3 text-center font-mono ${colorClass}`}>
                          {display}
                        </td>
                      );
                    });

                    const pct = studentMax > 0 ? Math.round((studentObt / studentMax) * 1000) / 10 : null;
                    let bandColor = PERFORMANCE_COLORS.GREY;
                    let bandLabel = 'No Data';

                    if (pct !== null) {
                      if (pct > 80) { bandColor = PERFORMANCE_COLORS.GREEN; bandLabel = '>80%'; }
                      else if (pct >= 60) { bandColor = PERFORMANCE_COLORS.YELLOW; bandLabel = '60-80%'; }
                      else if (pct >= 40) { bandColor = PERFORMANCE_COLORS.ORANGE; bandLabel = '40-60%'; }
                      else { bandColor = PERFORMANCE_COLORS.RED; bandLabel = '<40%'; }
                    }

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {stu.rollNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{stu.name}</div>
                          <div className="text-3xs text-slate-400 font-mono">UUID: {stu.id.substring(0, 15)}</div>
                        </td>

                        {subjectCells}

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {hasEvaluated ? studentObt : '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {pct !== null ? `${pct}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-3xs font-bold text-white shadow-2xs"
                            style={{ backgroundColor: bandColor.fillHex }}
                          >
                            {bandLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingStudent(stu)}
                              title="Enter / Edit Marks"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewStudent(stu)}
                              title="View Graph & Report"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const perfs = currentExam.subjects.map((sub) => {
                                  const entry = marksRec?.marks?.[sub.id];
                                  return calculateSubjectPerformance(sub, entry);
                                });
                                ExportService.exportIndividualStudentPDF(stu, currentExam, perfs, currentTeacher);
                              }}
                              title="Download Student PDF"
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Subject-Wise Student Graphs */}
      {activeTab === 'graphs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ScoreFuture Subject-Wise Percentage Graphs
              </h3>
              <p className="text-xs text-slate-500">
                Generated dynamically for each student in Class {currentTeacher.assignedClass} – {currentTeacher.assignedSection}.
                Subjects are automatically sorted in decreasing percentage order (highest on left, lowest on right).
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
              {filteredStudents.length} Graphs Rendered
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStudents.map((stu) => {
              const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === currentExam.id);
              return (
                <StudentSubjectGraph
                  key={stu.id}
                  student={stu}
                  exam={currentExam}
                  marksRecord={marksRec}
                  onOpenReportModal={() => setPreviewStudent(stu)}
                  showActions={true}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 3: Class-Wide Analytics */}
      {activeTab === 'class-analytics' && (
        <ClassSubjectGraph
          students={assignedStudents}
          exam={currentExam}
          marksList={marksList}
          className={currentTeacher.assignedClass}
          sectionName={currentTeacher.assignedSection}
        />
      )}

      {/* Tab Content 4: History & Audit Logs */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Class Activity & Audit Trail
            </h3>
          </div>
          <div className="space-y-3">
            {StorageService.getLogs()
              .filter(
                (l) =>
                  l.performedBy.id === currentTeacher.teacherId ||
                  l.details.includes(currentTeacher.assignedClass) ||
                  l.details.includes(currentTeacher.assignedSection)
              )
              .map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-2xs font-mono text-slate-500">
                        by {log.performedBy.name}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{log.details}</p>
                  </div>
                  <div className="text-2xs font-mono text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {isBulkUploadOpen && (
        <BulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          students={assignedStudents}
          exam={currentExam}
          onUploadSuccess={reloadData}
        />
      )}

      {isAddStudentOpen && (
        <AddStudentModal
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          assignedClass={currentTeacher.assignedClass}
          assignedSection={currentTeacher.assignedSection}
          assignedTeacherId={currentTeacher.teacherId}
          assignedTeacherName={currentTeacher.name}
          academicSession="2025-2026"
          onStudentAdded={reloadData}
        />
      )}

      {editingStudent && (
        <StudentMarksModal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
          exam={currentExam}
          marksRecord={marksList.find(
            (m) => m.studentId === editingStudent.id && m.examId === currentExam.id
          )}
          onSaveSuccess={reloadData}
        />
      )}

      {previewStudent && (
        <StudentReportCardModal
          isOpen={!!previewStudent}
          onClose={() => setPreviewStudent(null)}
          student={previewStudent}
          exam={currentExam}
          marksRecord={marksList.find(
            (m) => m.studentId === previewStudent.id && m.examId === currentExam.id
          )}
        />
      )}
    </div>
  );
};
