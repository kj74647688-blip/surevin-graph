import React, { useState } from 'react';
import { ClassConfig, Subject, Teacher } from '../../types';
import { StorageService } from '../../utils/storage';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle,
  Users,
  GraduationCap,
  Layers,
  Sparkles,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';

interface ClassSubjectManagementProps {
  onDataChanged?: () => void;
}

export const ClassSubjectManagement: React.FC<ClassSubjectManagementProps> = ({ onDataChanged }) => {
  const [classConfigs, setClassConfigs] = useState<ClassConfig[]>(() => StorageService.getClassConfigs());
  const [teachers, setTeachers] = useState<Teacher[]>(() => StorageService.getTeachers());
  
  // Active selected class for subject management
  const [selectedClassId, setSelectedClassId] = useState<string>(classConfigs[0]?.id || '');
  
  // Modals / Drawers
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSections, setNewClassSections] = useState('Gold, Silver');
  const [newClassSession, setNewClassSession] = useState('2026-2027');

  // Add / Edit Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectMaxMarks, setSubjectMaxMarks] = useState<number>(80);
  const [subjectPassingMarks, setSubjectPassingMarks] = useState<number>(32);

  // Teacher Assignment Drawer
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
  const [selectedTeacherToAssign, setSelectedTeacherToAssign] = useState<Teacher | null>(null);
  const [assignedClassSelect, setAssignedClassSelect] = useState('');
  const [assignedSectionSelect, setAssignedSectionSelect] = useState('');
  const [assignedSubjectIdsSelect, setAssignedSubjectIdsSelect] = useState<string[]>([]);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const selectedClass = classConfigs.find((c) => c.id === selectedClassId) || classConfigs[0];

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const sectionsArray = newClassSections
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newConfig: ClassConfig = {
      id: 'class-' + Date.now().toString(36),
      name: newClassName.trim(),
      sections: sectionsArray.length > 0 ? sectionsArray : ['A'],
      academicSession: newClassSession.trim() || '2026-2027',
      subjects: [
        { id: `sub-${Date.now()}-eng`, name: 'English', code: 'ENG', maxMarks: 80, passingMarks: 32 },
        { id: `sub-${Date.now()}-mth`, name: 'Mathematics', code: 'MTH', maxMarks: 80, passingMarks: 32 },
      ],
    };

    const updated = [...classConfigs, newConfig];
    setClassConfigs(updated);
    StorageService.saveClassConfigs(updated);
    setSelectedClassId(newConfig.id);
    setIsAddClassModalOpen(false);
    setNewClassName('');

    StorageService.addLog({
      performedBy: { role: 'ADMIN', id: 'SF-ADM-001', name: 'Dr. Alok Verma' },
      action: 'MANAGE_CLASS_SUBJECTS',
      details: `Created new class "${newConfig.name}" with sections: ${newConfig.sections.join(', ')}.`,
    });

    showNotification(`Class "${newConfig.name}" created successfully.`);
    onDataChanged?.();
  };

  const handleDeleteClass = (configId: string, name: string) => {
    if (classConfigs.length <= 1) {
      alert('You must keep at least one class configuration.');
      return;
    }
    if (confirm(`Are you sure you want to delete class configuration "${name}" and its subjects?`)) {
      const updated = classConfigs.filter((c) => c.id !== configId);
      setClassConfigs(updated);
      StorageService.saveClassConfigs(updated);
      setSelectedClassId(updated[0]?.id || '');
      showNotification(`Class "${name}" deleted.`);
      onDataChanged?.();
    }
  };

  // Open Subject Modal
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectName('');
    setSubjectCode('');
    setSubjectMaxMarks(80);
    setSubjectPassingMarks(32);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subj: Subject) => {
    setEditingSubject(subj);
    setSubjectName(subj.name);
    setSubjectCode(subj.code);
    setSubjectMaxMarks(subj.maxMarks);
    setSubjectPassingMarks(subj.passingMarks);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !selectedClass) return;

    let updatedSubjects: Subject[] = [];
    if (editingSubject) {
      updatedSubjects = selectedClass.subjects.map((s) => {
        if (s.id === editingSubject.id) {
          return {
            ...s,
            name: subjectName.trim(),
            code: subjectCode.trim() || subjectName.substring(0, 3).toUpperCase(),
            maxMarks: Number(subjectMaxMarks) || 80,
            passingMarks: Number(subjectPassingMarks) || 32,
          };
        }
        return s;
      });
    } else {
      const newSub: Subject = {
        id: `sub-${selectedClass.id}-${Date.now().toString(36)}`,
        name: subjectName.trim(),
        code: subjectCode.trim() || subjectName.substring(0, 3).toUpperCase(),
        maxMarks: Number(subjectMaxMarks) || 80,
        passingMarks: Number(subjectPassingMarks) || 32,
      };
      updatedSubjects = [...selectedClass.subjects, newSub];
    }

    const updatedConfigs = classConfigs.map((c) => {
      if (c.id === selectedClass.id) {
        return { ...c, subjects: updatedSubjects };
      }
      return c;
    });

    setClassConfigs(updatedConfigs);
    StorageService.saveClassConfigs(updatedConfigs);
    setIsSubjectModalOpen(false);

    StorageService.addLog({
      performedBy: { role: 'ADMIN', id: 'SF-ADM-001', name: 'Dr. Alok Verma' },
      action: 'MANAGE_CLASS_SUBJECTS',
      details: `${editingSubject ? 'Updated' : 'Added'} subject "${subjectName}" with Max Marks: ${subjectMaxMarks} for Class ${selectedClass.name}.`,
    });

    showNotification(`Subject "${subjectName}" saved for Class ${selectedClass.name}.`);
    onDataChanged?.();
  };

  const handleDeleteSubject = (subjId: string, sName: string) => {
    if (!selectedClass) return;
    if (confirm(`Remove subject "${sName}" from Class ${selectedClass.name}?`)) {
      const updatedSubjects = selectedClass.subjects.filter((s) => s.id !== subjId);
      const updatedConfigs = classConfigs.map((c) => {
        if (c.id === selectedClass.id) {
          return { ...c, subjects: updatedSubjects };
        }
        return c;
      });

      setClassConfigs(updatedConfigs);
      StorageService.saveClassConfigs(updatedConfigs);
      showNotification(`Subject "${sName}" removed from Class ${selectedClass.name}.`);
      onDataChanged?.();
    }
  };

  // Open Teacher Assignment
  const handleOpenAssignTeacher = (t: Teacher) => {
    setSelectedTeacherToAssign(t);
    setAssignedClassSelect(t.assignedClass || classConfigs[0]?.name || 'VI');
    setAssignedSectionSelect(t.assignedSection || 'Gold');
    setAssignedSubjectIdsSelect(t.assignedSubjectIds || []);
    setIsAssignTeacherModalOpen(true);
  };

  const handleSaveTeacherAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherToAssign) return;

    const classConfig = classConfigs.find((c) => c.name === assignedClassSelect) || classConfigs[0];
    const assignedSubjectsList = classConfig.subjects.filter((s) =>
      assignedSubjectIdsSelect.length > 0 ? assignedSubjectIdsSelect.includes(s.id) : true
    );

    const updated = teachers.map((t) => {
      if (t.id === selectedTeacherToAssign.id) {
        return {
          ...t,
          assignedClass: assignedClassSelect,
          assignedSection: assignedSectionSelect,
          assignedSubjectIds: assignedSubjectIdsSelect.length > 0 ? assignedSubjectIdsSelect : classConfig.subjects.map((s) => s.id),
          assignedSubjects: assignedSubjectsList,
        };
      }
      return t;
    });

    setTeachers(updated);
    StorageService.saveTeachers(updated);
    setIsAssignTeacherModalOpen(false);

    StorageService.addLog({
      performedBy: { role: 'ADMIN', id: 'SF-ADM-001', name: 'Dr. Alok Verma' },
      action: 'UPDATE_TEACHER',
      details: `Updated assignment for teacher ${selectedTeacherToAssign.name} (${selectedTeacherToAssign.teacherId}): Class ${assignedClassSelect} – ${assignedSectionSelect}, ${assignedSubjectsList.length} subjects.`,
    });

    showNotification(`Teacher assignment updated for ${selectedTeacherToAssign.name}.`);
    onDataChanged?.();
  };

  const toggleSubjectAssignmentCheckbox = (subjId: string) => {
    setAssignedSubjectIdsSelect((prev) =>
      prev.includes(subjId) ? prev.filter((id) => id !== subjId) : [...prev, subjId]
    );
  };

  return (
    <div className="space-y-8">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-2xs font-bold uppercase tracking-wider mb-2 border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Institutional Curriculum Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              CLASS & SUBJECT MANAGEMENT
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-2xl">
              Configure curriculum subjects and maximum marks separately for each class. Assign classes and subjects to teachers with automatic dashboard loading.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddClassModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Class</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid: Left = Class Selector, Right = Subject Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Class Navigation Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Configured Classes</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-3xs font-mono">
              {classConfigs.length} Classes
            </span>
          </h2>

          <div className="space-y-2 mt-1">
            {classConfigs.map((cfg) => {
              const isSelected = cfg.id === selectedClass?.id;
              return (
                <div
                  key={cfg.id}
                  onClick={() => setSelectedClassId(cfg.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-sm flex items-center gap-1.5">
                      <span>Class {cfg.name}</span>
                    </div>
                    <div className="text-2xs text-slate-500 mt-0.5">
                      Sections: {cfg.sections.join(', ')}
                    </div>
                    <div className="text-3xs text-blue-600 font-semibold mt-1">
                      {cfg.subjects.length} Subjects Configured
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-300 group-hover:text-slate-500'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Class Subject Detail Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          {selectedClass ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Curriculum Configuration
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Session: {selectedClass.academicSession}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    Class {selectedClass.name} — Subjects & Maximum Marks
                  </h2>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Available Sections: {selectedClass.sections.join(', ')} · Each subject has independent maximum marks.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddSubject}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Subject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteClass(selectedClass.id, selectedClass.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subject Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-3xs font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Subject Name</th>
                      <th className="py-3 px-4">Subject Code</th>
                      <th className="py-3 px-4 text-center">Maximum Marks</th>
                      <th className="py-3 px-4 text-center">Passing Marks</th>
                      <th className="py-3 px-4 text-center">Passing %</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {selectedClass.subjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">
                          No subjects configured for Class {selectedClass.name}. Click "+ Add Subject" above.
                        </td>
                      </tr>
                    ) : (
                      selectedClass.subjects.map((subj) => (
                        <tr key={subj.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>{subj.name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 text-2xs">
                            {subj.code}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-mono text-xs">
                              {subj.maxMarks}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                            {subj.passingMarks}
                          </td>
                          <td className="py-3.5 px-4 text-center text-2xs font-semibold text-slate-500">
                            {subj.maxMarks > 0 ? `${Math.round((subj.passingMarks / subj.maxMarks) * 100)}%` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSubject(subj)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Subject Details / Max Marks"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(subj.id, subj.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Subject"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400">
              Select or create a class to manage its subjects.
            </div>
          )}
        </div>
      </div>

      {/* Teacher Class & Subject Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Teacher Class & Subject Assignments</span>
            </h2>
            <p className="text-2xs text-slate-500 mt-0.5">
              Assigned teachers will automatically see these subjects and students on their dashboard upon login.
            </p>
          </div>
          <span className="text-2xs font-semibold text-slate-500">
            Total Teachers: {teachers.length}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-3xs font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Teacher Name</th>
                <th className="py-3 px-4">Teacher ID & Login Password</th>
                <th className="py-3 px-4">Assigned Class & Section</th>
                <th className="py-3 px-4">Assigned Subjects</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {teachers.map((tea) => {
                const assignedSubjs = StorageService.getTeacherAssignedSubjects(tea);
                return (
                  <tr key={tea.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{tea.name}</div>
                      <div className="text-3xs text-slate-400 font-normal">{tea.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700 bg-amber-50/50">
                      {tea.teacherId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">Class {tea.assignedClass}</span>
                      <span className="text-slate-500"> – {tea.assignedSection}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {assignedSubjs.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-3xs"
                          >
                            {s.name} ({s.maxMarks})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${
                          tea.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tea.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignTeacher(tea)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-2xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Assignment</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Class */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Add New Class & Curriculum</h3>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. VII, IX, XII — Commerce"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sections (comma separated) *</label>
                <input
                  type="text"
                  required
                  value={newClassSections}
                  onChange={(e) => setNewClassSections(e.target.value)}
                  placeholder="e.g. Gold, Silver, Platinum"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Session *</label>
                <input
                  type="text"
                  required
                  value={newClassSession}
                  onChange={(e) => setNewClassSession(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Subject */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingSubject ? `Edit Subject: ${editingSubject.name}` : `Add Subject to Class ${selectedClass?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Physics, Mathematics, Computer, Hindi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="e.g. PHY-12, MTH-06"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum Marks *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={subjectMaxMarks}
                    onChange={(e) => setSubjectMaxMarks(Number(e.target.value))}
                    placeholder="e.g. 70, 80, 100"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-mono font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    min="0"
                    max={subjectMaxMarks}
                    value={subjectPassingMarks}
                    onChange={(e) => setSubjectPassingMarks(Number(e.target.value))}
                    placeholder="e.g. 23, 32, 40"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 font-mono text-slate-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-3xs text-blue-800">
                <strong>Important:</strong> Maximum marks configured here are used for percentage calculation: <code>(Obtained / Max Marks) × 100</code>.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Teacher Class & Subject Assignment */}
      {isAssignTeacherModalOpen && selectedTeacherToAssign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Assign Class & Subjects: {selectedTeacherToAssign.name}
                </h3>
                <p className="text-3xs text-slate-500 font-mono">Teacher ID: {selectedTeacherToAssign.teacherId}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherAssignment} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Class *</label>
                  <select
                    value={assignedClassSelect}
                    onChange={(e) => {
                      const nextClass = e.target.value;
                      setAssignedClassSelect(nextClass);
                      const cfg = classConfigs.find((c) => c.name === nextClass);
                      if (cfg) {
                        setAssignedSectionSelect(cfg.sections[0] || 'Gold');
                        setAssignedSubjectIdsSelect(cfg.subjects.map((s) => s.id));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    {classConfigs.map((c) => (
                      <option key={c.id} value={c.name}>
                        Class {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Section *</label>
                  <select
                    value={assignedSectionSelect}
                    onChange={(e) => setAssignedSectionSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    {(() => {
                      const cfg = classConfigs.find((c) => c.name === assignedClassSelect) || classConfigs[0];
                      return cfg?.sections.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Subject Selection Checkboxes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Select Subjects Managed by this Teacher in Class {assignedClassSelect}:
                </label>
                {(() => {
                  const cfg = classConfigs.find((c) => c.name === assignedClassSelect) || classConfigs[0];
                  const subjects = cfg?.subjects || [];

                  if (subjects.length === 0) {
                    return <div className="text-slate-400 py-3">No subjects configured for this class.</div>;
                  }

                  return (
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                      {subjects.map((sub) => {
                        const isChecked = assignedSubjectIdsSelect.includes(sub.id);
                        return (
                          <label
                            key={sub.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-2xs font-semibold cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSubjectAssignmentCheckbox(sub.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="truncate">{sub.name} (Max {sub.maxMarks})</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignTeacherModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
