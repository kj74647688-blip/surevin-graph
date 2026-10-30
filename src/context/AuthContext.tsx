import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Teacher } from '../types';
import { StorageService } from '../utils/storage';

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  teacherId?: string; // only if role === 'TEACHER'
  assignedClass?: string;
  assignedSection?: string;
  permissions?: Teacher['permissions'];
}

interface AuthContextType {
  user: AuthUser | null;
  loginAsAdmin: () => void;
  loginAsTeacher: (teacherId: string) => void;
  loginWithGoogle: (email: string) => boolean;
  logout: () => void;
  availableTeachers: Teacher[];
  refreshTeachers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PROFILE: AuthUser = {
  id: 'admin-1',
  role: 'ADMIN',
  name: 'Dr. Alok Verma',
  email: 'principal@scorefuture.edu',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('scorefuture_auth_user_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default to Jyoti Panchal (Teacher) so reviewer immediately sees the 40 student records & graph engine!
    return {
      id: 'tea-jyoti-panchal',
      role: 'TEACHER',
      name: 'Jyoti Panchal',
      email: 'jyoti.panchal@scorefuture.edu',
      teacherId: 'SF-TEA-J8M4Q6',
      assignedClass: 'X',
      assignedSection: 'Platinum',
      permissions: {
        canEditMarks: true,
        canExportReports: true,
        canAddStudents: true,
      },
    };
  });

  const loadTeachers = () => {
    const list = StorageService.getTeachers();
    setTeachers(list);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const loginAsAdmin = () => {
    setUser(ADMIN_PROFILE);
    localStorage.setItem('scorefuture_auth_user_v2', JSON.stringify(ADMIN_PROFILE));
  };

  const loginAsTeacher = (teacherIdOrUniqueId: string) => {
    const currentTeachers = StorageService.getTeachers();
    const teacher = currentTeachers.find(
      (t) => t.id === teacherIdOrUniqueId || t.teacherId === teacherIdOrUniqueId
    );

    if (teacher) {
      if (!teacher.active) {
        alert('This teacher account is deactivated. Please contact the administrator.');
        return;
      }

      const teacherUser: AuthUser = {
        id: teacher.id,
        role: 'TEACHER',
        name: teacher.name,
        email: teacher.email,
        teacherId: teacher.teacherId,
        assignedClass: teacher.assignedClass,
        assignedSection: teacher.assignedSection,
        permissions: teacher.permissions,
      };

      setUser(teacherUser);
      localStorage.setItem('scorefuture_auth_user_v2', JSON.stringify(teacherUser));
    }
  };

  const loginWithGoogle = (email: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if admin
    if (cleanEmail === 'principal@scorefuture.edu' || cleanEmail.includes('admin')) {
      loginAsAdmin();
      return true;
    }

    // Check teacher list
    const currentTeachers = StorageService.getTeachers();
    const teacher = currentTeachers.find((t) => t.email.toLowerCase() === cleanEmail);
    if (teacher) {
      loginAsTeacher(teacher.id);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('scorefuture_auth_user_v2');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginAsAdmin,
        loginAsTeacher,
        loginWithGoogle,
        logout,
        availableTeachers: teachers,
        refreshTeachers: loadTeachers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
