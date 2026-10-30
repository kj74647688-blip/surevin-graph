import React, { useState, useMemo } from 'react';
import {
  Teacher,
  StudentRecord,
  Examination,
  StudentMarksRecord,
  AuditLog
} from '../../types';
import { StorageService } from '../../utils/storage';
import { ExportService } from '../../utils/exportUtils';
import { calculateSubjectPerformance } from '../../utils/constants';
import { TeacherProfileView } from './TeacherProfileView';
import { CreateTeacherModal } from './CreateTeacherModal';
import { ExamConfigModal } from './ExamConfigModal';
import { ClassSubjectManagement } from './ClassSubjectManagement';
import { ProductionCleanupModal } from './ProductionCleanupModal';
import { StudentSubjectGraph } from '../graphs/StudentSubjectGraph';
import { StudentReportCardModal } from '../reports/StudentReportCardModal';
import { StudentHistoryModal } from '../common/StudentHistoryModal';
import { TeacherGraphHistory } from '../teacher/TeacherGraphHistory';
import { SchoolSettingsModal } from './SchoolSettingsModal';
import {
  Users,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  Download,
  Plus,
  Search,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart3,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Trash2,
  Layers
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>(() => StorageService.getTeachers());
  const [students, setStudents] = useState<StudentRecord[]>(() => StorageService.getStudents());
  const [exams, setExams] = useState<Examination[]>(() => StorageService.getExams());
  const [marksList, setMarksList] = useState<StudentMarksRecord[]>(() => StorageService.getMarks());
  const [logs, setLogs] = useState<AuditLog[]>(() => StorageService.getLogs());

  // Navigation
  const [selectedTeacherForProfile, setSelectedTeacherForProfile] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<'teachers' | 'class-subjects' | 'teacher-graph-projects' | 'students' | 'school-graphs' | 'exams' | 'reports' | 'logs'>('teachers');

  // Search & Filters
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || 'exam-midterm-2026');

  // Modals
  const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSchoolSettingsOpen, setIsSchoolSettingsOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Examination | null>(null);
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState<StudentRecord | null>(null);

  const reloadData = () => {
    setTeachers(StorageService.getTeachers());
    setStudents(StorageService.getStudents());
    setExams(StorageService.getExams());
    setMarksList(StorageService.getMarks());
    setLogs(StorageService.getLogs());
  };

  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  // Toggle teacher active status
  const handleToggleTeacherStatus = (teacherId: string) => {
    const updated = teachers.map((t) => {
      if (t.id === teacherId || t.teacherId === teacherId) {
        const nextStatus = !t.active;
        StorageService.addLog({
          performedBy: {
            role: 'ADMIN',
            id: 'SF-ADM-001',
            name: 'Mr. Sharukh Tyagi (Administrator)',
          },
          action: 'TOGGLE_TEACHER_STATUS',
          details: `${nextStatus ? 'Activated' : 'Suspended'} teacher account for ${t.name} (${t.teacherId}).`,
          metadata: { teacherId: t.teacherId, active: nextStatus },
        });
        return { ...t, active: nextStatus };
      }
      return t;
    });

    setTeachers(updated);
    StorageService.saveTeachers(updated);
    reloadData();
  };

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.teacherId.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.assignedClass.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.assignedSection.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [teachers, teacherSearch]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNumber.includes(studentSearch) ||
        s.assignedTeacherName.toLowerCase().includes(studentSearch.toLowerCase());

      const matchClass = selectedClassFilter === 'ALL' || s.class === selectedClassFilter;
      return matchSearch && matchClass;
    });
  }, [students, studentSearch, selectedClassFilter]);

  // If viewing a single teacher's profile deep dive (e.g. Jyoti Panchal)
  if (selectedTeacherForProfile) {
    return (
      <TeacherProfileView
        teacher={selectedTeacherForProfile}
        onBack={() => {
          setSelectedTeacherForProfile(null);
          reloadData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin School Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-amber-400 font-black text-xl shadow-md shrink-0">
              ADM
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Surevin International School Admin Portal
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                  Master Control
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                <span>Administrator: Mr. Sharukh Tyagi</span>
                <span>·</span>
                <span>School-Wide Access</span>
                <span>·</span>
                <span>Academic Session: 2025-2026</span>
                <span>·</span>
                <span className="font-semibold text-emerald-700">Strict 2-Role Security (Admin & Teachers Only)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateTeacherOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Teacher Account</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('class-subjects')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Class & Subject Management</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSchoolSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>School Settings</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setExamToEdit(null);
                setIsExamModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>Configure Exams</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCleanupModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Clean old demo/sample data to start genuine production use"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Clean Production Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Level School Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-2xs uppercase tracking-wider font-bold text-slate-500">Authorized Teachers</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{teachers.length}</div>
          <div className="text-2xs text-emerald-600 mt-1 font-medium">
            {teachers.filter((t) => t.active).length} Active in Roster
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-2xs uppercase tracking-wider font-bold text-slate-500">Student Academic Records</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{students.length}</div>
          <div className="text-2xs text-slate-500 mt-1">
            Zero student login accounts
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-2xs uppercase tracking-wider font-bold text-slate-500">Configured Examinations</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{exams.length}</div>
          <div className="text-2xs text-indigo-600 mt-1 font-medium">
            Active: {currentExam.name}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-2xs uppercase tracking-wider font-bold text-slate-500">Audit Trail Events</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{logs.length}</div>
          <div className="text-2xs text-slate-500 mt-1">
            Full marks & user traceability
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('teachers')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'teachers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Teachers Directory & Assigned Classes ({teachers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('class-subjects')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'class-subjects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Class & Subject Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teacher-graph-projects')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'teacher-graph-projects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Teacher Graph Projects & Auto Graphs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'students'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All School Student Records ({students.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('school-graphs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'school-graphs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          School-Wide Graphs & Analytics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'exams'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Examinations & Subjects ({exams.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Central School Reports & Downloads
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Security & Audit Trail
        </button>
      </div>

      {/* Tab 1: Teachers Directory */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search teacher, ID, class (e.g. Jyoti Panchal)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="text-xs text-slate-500">
              Click <strong>"View Profile"</strong> to open teacher's students, graphs, and upload history.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-3xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Teacher Name & Email</th>
                  <th className="py-3 px-4">Unique Teacher ID</th>
                  <th className="py-3 px-4">Assigned Class & Section</th>
                  <th className="py-3 px-3 text-center">Managed Students</th>
                  <th className="py-3 px-3 text-center">Account Status</th>
                  <th className="py-3 px-4 text-center">Permissions</th>
                  <th className="py-3 px-4 text-right">Teacher Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => {
                  const studentCount = students.filter(
                    (s) =>
                      s.assignedTeacherId === t.teacherId ||
                      (s.class === t.assignedClass && s.section === t.assignedSection)
                  ).length;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-3xs text-slate-500">{t.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                          {t.teacherId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          Class {t.assignedClass} – {t.assignedSection}
                        </div>
                        <div className="text-3xs text-slate-400">{t.department || 'Academics'}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {studentCount} Students
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTeacherStatus(t.id)}
                          title="Click to toggle teacher account activation"
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold border transition-colors cursor-pointer ${
                            t.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {t.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{t.active ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-3xs font-mono text-slate-600">
                          {t.permissions.canEditMarks && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded" title="Can Edit Marks">Marks</span>
                          )}
                          {t.permissions.canExportReports && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded" title="Can Export Reports">Reports</span>
                          )}
                          {t.permissions.canAddStudents && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded" title="Can Add Students">Roster</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherForProfile(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Class & Subject Management */}
      {activeTab === 'class-subjects' && (
        <ClassSubjectManagement onDataChanged={reloadData} />
      )}

      {/* Tab: Teacher Graph Projects Across School */}
      {activeTab === 'teacher-graph-projects' && (
        <TeacherGraphHistory
          onOpenProjectInGenerator={() => {
            alert('To edit this draft live in the spreadsheet, log in as the assigned teacher or switch to Teacher View.');
          }}
          onNewExaminationReport={() => {
            alert('Switch to Teacher View (e.g. Jyoti Panchal) to create and generate new graph spreadsheets.');
          }}
        />
      )}

      {/* Tab 2: All School Student Records */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student or roll #..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
              >
                <option value="ALL">All Classes</option>
                <option value="VIII">Class VIII</option>
                <option value="IX">Class IX</option>
                <option value="X">Class X</option>
                <option value="XI">Class XI</option>
                <option value="XII">Class XII</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Total {filteredStudents.length} Academic Records (Strictly managed under teachers)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-3xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">Database UUID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-3 text-center">Roll Number</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Assigned Teacher</th>
                  <th className="py-3 px-3 text-center">Academic Session</th>
                  <th className="py-3 px-4 text-right">Reports & Graphs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-3xs text-slate-500">{s.id.substring(0, 18)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700">#{s.rollNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">Class {s.class} – {s.section}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{s.assignedTeacherName}</div>
                      <div className="text-3xs font-mono text-slate-400">{s.assignedTeacherId}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{s.academicSession}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryStudent(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                          title="View student examination history and academic progress across all exams"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewStudent(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Graph</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const marksRec = marksList.find((m) => m.studentId === s.id && m.examId === currentExam.id);
                            const perfs = currentExam.subjects.map((sub) => {
                              const entry = marksRec?.marks?.[sub.id];
                              return calculateSubjectPerformance(sub, entry);
                            });
                            ExportService.exportIndividualStudentPDF(s, currentExam, perfs);
                          }}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          title="Download PDF Report Card"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: School-Wide Graphs */}
      {activeTab === 'school-graphs' && (
        <div className="space-y-6">
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                School-Wide ScoreFuture Graphs & Comparison
              </h3>
              <p className="text-xs text-slate-500">
                View student graphs across all classes and teachers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Exam:</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {students.slice(0, 10).map((stu) => {
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

          {students.length > 10 && (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
              Showing top 10 sample graphs. To inspect all 40 students of a specific teacher, open the{' '}
              <button
                type="button"
                onClick={() => setActiveTab('teachers')}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Teachers Directory
              </button>{' '}
              and click "View Profile" on Jyoti Panchal.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Examinations & Subjects */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Configured School Examinations & Maximum Marks
            </h3>
            <button
              type="button"
              onClick={() => {
                setExamToEdit(null);
                setIsExamModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Examination</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xs uppercase font-bold text-slate-400 font-mono">
                      Session {ex.academicSession}
                    </span>
                    <span
                      className={`text-3xs font-bold px-2 py-0.5 rounded-full capitalize ${
                        ex.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{ex.name}</h4>

                  {/* Subjects list */}
                  <div className="mt-4 space-y-1.5">
                    <div className="text-3xs uppercase font-bold text-slate-500">
                      Configured Subjects ({ex.subjects.length}):
                    </div>
                    {ex.subjects.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-100 text-slate-700"
                      >
                        <span className="font-medium truncate">{sub.name}</span>
                        <span className="font-mono text-3xs font-bold text-slate-500">
                          Max: {sub.maxMarks}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setExamToEdit(ex);
                      setIsExamModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Edit Exam & Marks</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Central School Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Central Institutional Report Generation & Downloads
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              As an Administrator, you can download all class graph PDFs, Excel workbooks, and subject summaries across every teacher and section in the school.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((t) => {
              const classStudents = students.filter(
                (s) =>
                  s.assignedTeacherId === t.teacherId ||
                  (s.class === t.assignedClass && s.section === t.assignedSection)
              );

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Class {t.assignedClass} – {t.assignedSection}
                      </span>
                      <span className="text-3xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {t.teacherId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Teacher: <strong>{t.name}</strong> · {classStudents.length} Students
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        ExportService.exportClassPDF(
                          classStudents,
                          marksList,
                          currentExam,
                          t.assignedClass,
                          t.assignedSection,
                          t
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Class PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        ExportService.exportClassExcelWorkbook(
                          classStudents,
                          marksList,
                          currentExam,
                          t.assignedClass,
                          t.assignedSection,
                          t.name
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel Workbook</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTeacherForProfile(t)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:underline cursor-pointer ml-auto"
                    >
                      <span>Teacher Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 6: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                School-Wide Security & Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Immutable trace of all mark uploads, corrections, student additions, and permission adjustments.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-2xs font-mono text-slate-500">
                      by {log.performedBy.name} ({log.performedBy.role} · {log.performedBy.id})
                    </span>
                  </div>
                  <p className="text-slate-700 mt-1">{log.details}</p>
                </div>
                <div className="text-2xs font-mono text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSchoolSettingsOpen && (
        <SchoolSettingsModal
          isOpen={isSchoolSettingsOpen}
          onClose={() => setIsSchoolSettingsOpen(false)}
          onSaved={reloadData}
        />
      )}

      {isCreateTeacherOpen && (
        <CreateTeacherModal
          isOpen={isCreateTeacherOpen}
          onClose={() => setIsCreateTeacherOpen(false)}
          onTeacherCreated={reloadData}
        />
      )}

      {isExamModalOpen && (
        <ExamConfigModal
          isOpen={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          examToEdit={examToEdit}
          onSaved={reloadData}
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

      {selectedHistoryStudent && (
        <StudentHistoryModal
          isOpen={!!selectedHistoryStudent}
          onClose={() => setSelectedHistoryStudent(null)}
          student={selectedHistoryStudent}
        />
      )}

      {isCleanupModalOpen && (
        <ProductionCleanupModal
          isOpen={isCleanupModalOpen}
          onClose={() => setIsCleanupModalOpen(false)}
          onSuccess={reloadData}
        />
      )}
    </div>
  );
};
