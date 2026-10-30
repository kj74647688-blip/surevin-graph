import React, { useState } from 'react';
import { StudentRecord, Teacher } from '../../types';
import { generateUUID } from '../../utils/constants';
import { StorageService } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, X, Check } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedClass: string;
  assignedSection: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  academicSession: string;
  onStudentAdded: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  assignedClass,
  assignedSection,
  assignedTeacherId,
  assignedTeacherName,
  academicSession,
  onStudentAdded,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide student full name.');
      return;
    }
    if (!rollNumber.trim()) {
      setError('Please provide roll number.');
      return;
    }

    const students = StorageService.getStudents();
    
    // Check if roll number already exists in this class & section
    const duplicate = students.find(
      (s) => s.class === assignedClass && s.section === assignedSection && s.rollNumber === rollNumber.trim()
    );
    if (duplicate) {
      setError(`Roll number ${rollNumber} already exists in Class ${assignedClass} – ${assignedSection} (${duplicate.name}).`);
      return;
    }

    const newStudent: StudentRecord = {
      id: generateUUID(),
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      class: assignedClass,
      section: assignedSection,
      assignedTeacherId,
      assignedTeacherName,
      academicSession,
      createdAt: new Date().toISOString(),
    };

    students.push(newStudent);
    StorageService.saveStudents(students);

    // Add Audit Log
    StorageService.addLog({
      performedBy: {
        role: user?.role || 'TEACHER',
        id: user?.teacherId || user?.id || 'SF-USER',
        name: user?.name || 'Authorized Teacher',
      },
      action: 'CREATE_STUDENT',
      details: `Added new academic student record: ${newStudent.name} (Roll #${newStudent.rollNumber}) to Class ${assignedClass} – ${assignedSection} under ${assignedTeacherName}.`,
      metadata: { studentId: newStudent.id, rollNumber: newStudent.rollNumber },
    });

    onStudentAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold">Add Academic Student Record</h2>
              <p className="text-2xs text-slate-400">
                Class {assignedClass} – {assignedSection} · No login or credentials generated
              </p>
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
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <strong>Notice:</strong> In accordance with ScoreFuture policy, students exist purely as academic records. No student user accounts, passwords, or login access will be created.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ananya Sen"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Roll Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 141"
              value={rollNumber}
              onChange={(e) => { setRollNumber(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 block text-2xs">Class & Section</span>
              <span className="font-bold text-slate-800">Class {assignedClass} – {assignedSection}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 block text-2xs">Assigned Teacher</span>
              <span className="font-bold text-slate-800 truncate block">{assignedTeacherName}</span>
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
              <span>Create Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
