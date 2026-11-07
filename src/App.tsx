import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { LoginView } from './components/auth/LoginView';
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';
import { TeacherGraphGenerator } from './components/teacher/TeacherGraphGenerator';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StorageService } from './utils/storage';
import { BarChart3, Users, Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading, isVerificationPending, pendingVerificationEmail, checkVerificationStatus, logout } = useAuth();
  const [teacherActiveTab, setTeacherActiveTab] = useState<'generator' | 'roster'>('generator');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading ScoreFuture Auth Engine...</p>
        </div>
      </div>
    );
  }

  // Mandatory Email Verification Screen
  if (isVerificationPending && pendingVerificationEmail) {
    return (
      <EmailVerificationBanner
        email={pendingVerificationEmail}
        onVerifiedSuccess={() => checkVerificationStatus()}
        onLogout={() => logout()}
      />
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Teacher Role View
  if (user.role === 'TEACHER') {
    const teachers = StorageService.getTeachers();
    let currentTeacher = teachers.find(
      (t) =>
        (t.id && t.id.toLowerCase() === user.id.toLowerCase()) ||
        (user.teacherId && t.teacherId.toLowerCase() === user.teacherId.toLowerCase()) ||
        (user.email && t.email.toLowerCase() === user.email.toLowerCase())
    );

    if (!currentTeacher) {
      // Synthesize active teacher object from verified user session
      currentTeacher = {
        id: user.id || `tea-${Date.now()}`,
        teacherId: user.teacherId || `SF-TEA-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        name: user.name || 'Faculty Member',
        email: user.email,
        assignedClass: user.assignedClass || 'X',
        assignedSection: user.assignedSection || 'Platinum',
        department: 'Academics',
        active: true,
        permissions: user.permissions || { canEditMarks: true, canExportReports: true, canAddStudents: true },
        createdAt: new Date().toISOString(),
      };
      StorageService.addTeacher(currentTeacher);
    }

    if (currentTeacher.active === false) {
      return (
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl border border-rose-200 text-center shadow-sm">
            <h2 className="text-base font-bold text-rose-700">Teacher Account Suspended</h2>
            <p className="text-xs text-slate-600 mt-2">
              Your teacher account ({user.teacherId || user.email}) is currently deactivated. Please contact the administrator for reactivation.
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
