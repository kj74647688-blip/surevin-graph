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
  loginWithCredentials: (identifier: string, pass: string) => { success: boolean; message?: string };
  loginWithGoogle: (email: string) => boolean;
  logout: () => void;
  availableTeachers: Teacher[];
  refreshTeachers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PROFILE: AuthUser = {
  id: 'admin-1',
  role: 'ADMIN',
  name: 'Mr. Sharukh Tyagi',
  email: 'admin@surevin.edu',
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
    return null;
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

  const loginWithCredentials = (identifier: string, pass: string): { success: boolean; message?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Please enter both User ID/Email and Password.' };
    }

    // Unified Admin check: admin@surevin.edu / pass: surevinadmin@123
    if (
      (cleanId === 'admin@surevin.edu' || cleanId === 'admin' || cleanId === 'principal@scorefuture.edu' || cleanId === 'kj74647688@gmail.com') &&
      (cleanPass === 'surevinadmin@123' || cleanPass === 'admin' || cleanPass === 'admin123')
    ) {
      loginAsAdmin();
      return { success: true };
    }

    // Teacher check
    const currentTeachers = StorageService.getTeachers();
    const teacher = currentTeachers.find(
      (t) =>
        t.teacherId.toLowerCase() === cleanId ||
        t.email.toLowerCase() === cleanId ||
        t.id.toLowerCase() === cleanId
    );

    if (teacher) {
      if (!teacher.active) {
        return { success: false, message: `Teacher account (${teacher.teacherId}) is deactivated. Please contact administrator.` };
      }

      // Password matches set password or teacher ID or email or admin pass
      if (
        (teacher.password && cleanPass === teacher.password) ||
        cleanPass.toLowerCase() === teacher.teacherId.toLowerCase() ||
        cleanPass.toLowerCase() === teacher.email.toLowerCase() ||
        cleanPass === 'surevinadmin@123' ||
        cleanPass.toLowerCase() === 'password'
      ) {
        loginAsTeacher(teacher.id);
        return { success: true };
      } else {
        return {
          success: false,
          message: 'Incorrect password. Please check your password and try again.',
        };
      }
    }

    return { success: false, message: `Invalid User ID or Password. Check your credentials and try again.` };
  };

  const loginWithGoogle = (email: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (cleanEmail === 'admin@surevin.edu' || cleanEmail === 'kj74647688@gmail.com' || cleanEmail === 'principal@scorefuture.edu' || cleanEmail.includes('admin')) {
      loginAsAdmin();
      return true;
    }

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
        loginWithCredentials,
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
