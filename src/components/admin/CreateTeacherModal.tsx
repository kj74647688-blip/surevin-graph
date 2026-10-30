import React, { useState } from 'react';
import { Teacher } from '../../types';
import { generateTeacherId } from '../../utils/constants';
import { StorageService } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, X, Key, Check, ShieldCheck } from 'lucide-react';

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeacherCreated: () => void;
}

export const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({
  isOpen,
  onClose,
  onTeacherCreated,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [assignedClass, setAssignedClass] = useState('X');
  const [assignedSection, setAssignedSection] = useState('Gold');
  const [department, setDepartment] = useState('Science & Mathematics');
  const [canEditMarks, setCanEditMarks] = useState(true);
  const [canExportReports, setCanExportReports] = useState(true);
  const [canAddStudents, setCanAddStudents] = useState(true);
  const [generatedId, setGeneratedId] = useState(() => generateTeacherId());
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRegenerateId = () => {
    setGeneratedId(generateTeacherId());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide teacher name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid institutional email address.');
      return;
    }

    const teachers = StorageService.getTeachers();

    // Check duplicate email or ID
    if (teachers.some((t) => t.email.toLowerCase() === email.trim().toLowerCase())) {
      setError('A teacher with this email address already exists.');
      return;
    }

    const newTeacher: Teacher = {
      id: 'tea-' + Date.now().toString(36),
      teacherId: generatedId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      assignedClass: assignedClass.trim().toUpperCase(),
      assignedSection: assignedSection.trim(),
      department: department.trim(),
      active: true,
      permissions: {
        canEditMarks,
        canExportReports,
        canAddStudents,
      },
      createdAt: new Date().toISOString(),
    };

    teachers.push(newTeacher);
    StorageService.saveTeachers(teachers);

    // Audit Log
    StorageService.addLog({
      performedBy: {
        role: 'ADMIN',
        id: user?.id || 'SF-ADM-001',
        name: user?.name || 'Administrator',
      },
      action: 'CREATE_TEACHER',
      details: `Created teacher account for ${newTeacher.name} with unique ID ${newTeacher.teacherId}. Assigned to Class ${newTeacher.assignedClass} – ${newTeacher.assignedSection}.`,
      metadata: { teacherId: newTeacher.teacherId, assignedClass: newTeacher.assignedClass, assignedSection: newTeacher.assignedSection },
    });

    onTeacherCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold">Create Authorized Teacher Account</h2>
              <p className="text-2xs text-slate-400">Generate unique teacher ID & assign class section</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Unique Teacher ID Preview */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-3xs uppercase font-bold text-indigo-700 tracking-wider">
                System Generated Teacher ID
              </div>
              <div className="text-base font-mono font-bold text-indigo-950 mt-0.5">
                {generatedId}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRegenerateId}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              Regenerate
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teacher Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jyoti Panchal"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Authorized Institutional Email (Google Auth) *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. teacher@scorefuture.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Class *
              </label>
              <select
                value={assignedClass}
                onChange={(e) => setAssignedClass(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:border-indigo-500 bg-white"
              >
                <option value="VIII">Class VIII</option>
                <option value="IX">Class IX</option>
                <option value="X">Class X</option>
                <option value="XI">Class XI</option>
                <option value="XII">Class XII</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Section *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Platinum, Diamond, A"
                value={assignedSection}
                onChange={(e) => setAssignedSection(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department / Specialization
            </label>
            <input
              type="text"
              placeholder="e.g. Mathematics & Physical Sciences"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Permissions & Authority
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canEditMarks}
                  onChange={(e) => setCanEditMarks(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Can upload & edit student marks</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canExportReports}
                  onChange={(e) => setCanExportReports(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Can export student & class PDF/Excel reports</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canAddStudents}
                  onChange={(e) => setCanAddStudents(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Can add new student records to assigned class</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Create Teacher Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
