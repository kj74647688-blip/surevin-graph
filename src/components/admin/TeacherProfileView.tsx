import React, { useState, useMemo } from 'react';
import {
  Teacher,
  StudentRecord,
  Examination,
  StudentMarksRecord
} from '../../types';
import { StorageService } from '../../utils/storage';
import { ExportService } from '../../utils/exportUtils';
import {
  calculateSubjectPerformance,
  PERFORMANCE_COLORS
} from '../../utils/constants';
import { StudentSubjectGraph } from '../graphs/StudentSubjectGraph';
import { ClassSubjectGraph } from '../graphs/ClassSubjectGraph';
import { BulkUploadModal } from '../teacher/BulkUploadModal';
import { StudentMarksModal } from '../teacher/StudentMarksModal';
import { AddStudentModal } from '../teacher/AddStudentModal';
import { StudentReportCardModal } from '../reports/StudentReportCardModal';
import {
  ArrowLeft,
  Users,
  Award,
  Download,
  FileSpreadsheet,
  Upload,
  Plus,
  BarChart3,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

interface TeacherProfileViewProps {
  teacher: Teacher;
  onBack: () => void;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ teacher, onBack }) => {
  const [students, setStudents] = useState<StudentRecord[]>(() => StorageService.getStudents());
  const [exams, setExams] = useState<Examination[]>(() => StorageService.getExams());
  const [marksList, setMarksList] = useState<StudentMarksRecord[]>(() => StorageService.getMarks());
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || 'exam-midterm-2026');

  const [activeTab, setActiveTab] = useState<'roster' | 'individual-graphs' | 'class-graphs' | 'history'>('roster');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);

  const reloadData = () => {
    setStudents(StorageService.getStudents());
    setMarksList(StorageService.getMarks());
    setExams(StorageService.getExams());
  };

  // Filter students under this teacher
  const teacherStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.assignedTeacherId === teacher.teacherId ||
        (s.class === teacher.assignedClass && s.section === teacher.assignedSection)
    );
  }, [students, teacher]);

  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  const filteredStudents = useMemo(() => {
    return teacherStudents.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.includes(searchQuery)
    );
  }, [teacherStudents, searchQuery]);

  // Download handlers
  const handleDownloadClassPDF = () => {
    ExportService.exportClassPDF(
      teacherStudents,
      marksList,
      currentExam,
      teacher.assignedClass,
      teacher.assignedSection,
      teacher
    );
  };

  const handleDownloadClassExcel = () => {
    ExportService.exportClassExcelWorkbook(
      teacherStudents,
      marksList,
      currentExam,
      teacher.assignedClass,
      teacher.assignedSection,
      teacher.name
    );
  };

  // Activity logs specific to this teacher
  const teacherLogs = useMemo(() => {
    return StorageService.getLogs().filter(
      (l) =>
        l.performedBy.id === teacher.teacherId ||
        l.details.includes(teacher.teacherId) ||
        l.details.includes(teacher.name) ||
        (l.details.includes(teacher.assignedClass) && l.details.includes(teacher.assignedSection))
    );
  }, [teacher]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Teachers</span>
        </button>
        <span className="text-slate-400">/</span>
        <span className="text-xs font-bold text-slate-900">Teacher Profile: {teacher.name}</span>
      </div>

      {/* Teacher Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-700 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0">
              {teacher.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {teacher.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                  {teacher.teacherId}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                    teacher.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {teacher.active ? 'Active Teacher' : 'Account Suspended'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900">
                  Assigned Class: Class {teacher.assignedClass} – {teacher.assignedSection}
                </span>
                <span>·</span>
                <span className="font-semibold text-indigo-700">
                  {teacherStudents.length} Students Managed
                </span>
                <span>·</span>
                <span>{teacher.email}</span>
                <span>·</span>
                <span>{teacher.department || 'General Academics'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Add Student</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBulkUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Upload Marks</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadClassPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Class PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadClassExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Marks Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Examination Selector & Quick Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
            Selected Examination:
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.subjects.length} Subjects)
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Exam Session: <strong>{currentExam.academicSession}</strong> · Status: <span className="capitalize font-bold text-emerald-600">{currentExam.status}</span>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'roster'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All {teacherStudents.length} Students Roster & Marks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('individual-graphs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'individual-graphs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Every Student's Individual Graph
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('class-graphs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'class-graphs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Subject-Wise Class Graphs
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
          Upload History & Audit Trail ({teacherLogs.length})
        </button>
      </div>

      {/* Tab 1: Student Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students in this class..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing {filteredStudents.length} of {teacherStudents.length} academic student records
            </div>
          </div>

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
                  <th className="py-3 px-3 text-center">Overall %</th>
                  <th className="py-3 px-4 text-center">Band</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stu) => {
                  const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === currentExam.id);
                  let obt = 0;
                  let max = 0;

                  const subjectCells = currentExam.subjects.map((sub) => {
                    const entry = marksRec?.marks?.[sub.id];
                    const perf = calculateSubjectPerformance(sub, entry);
                    if (perf.obtained !== null && !perf.isAbsent && !perf.isUnverified) {
                      obt += perf.obtained;
                      max += sub.maxMarks;
                    }
                    let display = '—';
                    let colClass = 'text-slate-400';
                    if (perf.isAbsent) {
                      display = 'ABS';
                      colClass = 'text-rose-600 font-bold';
                    } else if (perf.obtained !== null) {
                      display = String(perf.obtained);
                      if (perf.band === 'GREEN') colClass = 'text-emerald-700 font-bold';
                      else if (perf.band === 'YELLOW') colClass = 'text-amber-700 font-semibold';
                      else if (perf.band === 'ORANGE') colClass = 'text-orange-700';
                      else colClass = 'text-rose-600 font-bold';
                    }

                    return (
                      <td key={sub.id} className={`py-3 px-3 text-center font-mono ${colClass}`}>
                        {display}
                      </td>
                    );
                  });

                  const pct = max > 0 ? Math.round((obt / max) * 1000) / 10 : null;
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
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{stu.rollNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{stu.name}</td>
                      {subjectCells}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">{max > 0 ? obt : '—'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">{pct !== null ? `${pct}%` : '—'}</td>
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
                            title="Edit Marks as Administrator"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewStudent(stu)}
                            title="View Individual Graph"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
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
                              ExportService.exportIndividualStudentPDF(stu, currentExam, perfs, teacher);
                            }}
                            title="Download PDF Report"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Individual Graphs for All Students */}
      {activeTab === 'individual-graphs' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Individual ScoreFuture Graphs — {teacher.name} (Class {teacher.assignedClass} – {teacher.assignedSection})
              </h3>
              <p className="text-xs text-slate-500">
                Showing all {teacherStudents.length} student graphs sorted strictly in decreasing percentage order (highest on left, lowest on right).
              </p>
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

      {/* Tab 3: Subject-Wise Class Graphs */}
      {activeTab === 'class-graphs' && (
        <ClassSubjectGraph
          students={teacherStudents}
          exam={currentExam}
          marksList={marksList}
          className={teacher.assignedClass}
          sectionName={teacher.assignedSection}
        />
      )}

      {/* Tab 4: Upload History & Audit Logs */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Audit Logs & Upload History for {teacher.name}
            </h3>
          </div>
          {teacherLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No previous audit logs recorded for this teacher account.
            </p>
          ) : (
            <div className="space-y-3">
              {teacherLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-2xs font-mono text-slate-500">
                        by {log.performedBy.name} ({log.performedBy.role})
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
          )}
        </div>
      )}

      {/* Modals */}
      {isBulkUploadOpen && (
        <BulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          students={teacherStudents}
          exam={currentExam}
          onUploadSuccess={reloadData}
        />
      )}

      {isAddStudentOpen && (
        <AddStudentModal
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          assignedClass={teacher.assignedClass}
          assignedSection={teacher.assignedSection}
          assignedTeacherId={teacher.teacherId}
          assignedTeacherName={teacher.name}
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
