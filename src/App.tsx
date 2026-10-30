import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { LoginView } from './components/auth/LoginView';
import { TeacherGraphGenerator } from './components/teacher/TeacherGraphGenerator';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StorageService } from './utils/storage';
import { BarChart3, Users } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const [teacherActiveTab, setTeacherActiveTab] = useState<'generator' | 'roster'>('generator');

  if (!user) {
    return <LoginView />;
  }

  // Teacher Role View
  if (user.role === 'TEACHER') {
    const teachers = StorageService.getTeachers();
    const currentTeacher = teachers.find(
      (t) => t.id === user.id || t.teacherId === user.teacherId
    );

    if (!currentTeacher || !currentTeacher.active) {
      return (
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl border border-rose-200 text-center shadow-sm">
            <h2 className="text-base font-bold text-rose-700">Teacher Account Suspended</h2>
            <p className="text-xs text-slate-600 mt-2">
              Your teacher account ({user.teacherId}) is currently inactive. Please contact the administrator for reactivation.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />

        {/* Teacher Navigation Bar */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setTeacherActiveTab('generator')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  teacherActiveTab === 'generator'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>My Graph Generator (Excel Spreadsheet & Auto Graphs)</span>
              </button>

              <button
                type="button"
                onClick={() => setTeacherActiveTab('roster')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  teacherActiveTab === 'roster'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Class Roster & Student Records (Class {currentTeacher.assignedClass} – {currentTeacher.assignedSection})</span>
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {teacherActiveTab === 'generator' ? (
            <TeacherGraphGenerator teacher={currentTeacher} />
          ) : (
            <TeacherDashboard currentTeacher={currentTeacher} />
          )}
        </main>
      </div>
    );
  }

  // Admin Role View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
