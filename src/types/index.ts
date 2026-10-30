export type UserRole = 'ADMIN' | 'TEACHER';

export interface Teacher {
  id: string;
  teacherId: string; // e.g. SF-TEA-J8M4Q6
  name: string;
  email: string;
  avatar?: string;
  designation?: string; // e.g. "Senior PGT Teacher"
  phone?: string;
  assignedClass: string; // e.g. "X"
  assignedSection: string; // e.g. "Platinum"
  department?: string;
  active: boolean;
  permissions: {
    canEditMarks: boolean;
    canExportReports: boolean;
    canAddStudents: boolean;
  };
  createdAt: string;
}

export interface StudentRecord {
  id: string; // Internal database UUID
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  assignedTeacherId: string; // references Teacher.teacherId
  assignedTeacherName: string;
  academicSession: string; // e.g. "2025-2026"
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  maxMarks: number;
  passingMarks: number;
}

export interface Examination {
  id: string;
  name: string;
  academicSession: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
  subjects: Subject[];
}

export interface SubjectMarkEntry {
  obtained: number | null; // null if missing or not yet entered
  isAbsent?: boolean;
  isUnverified?: boolean;
  remarks?: string;
}

export interface StudentMarksRecord {
  id: string;
  studentId: string; // references StudentRecord.id
  examId: string; // references Examination.id
  marks: Record<string, SubjectMarkEntry>; // subjectId -> entry
  updatedAt: string;
  updatedBy: string; // teacherId or admin username
  updatedByName: string;
}

export interface SchoolSettings {
  schoolName: string;
  academicSession: string;
  affiliationNumber?: string;
  address?: string;
  principalName?: string;
}

// Teacher Spreadsheet & Graph Generator Types
export interface SpreadsheetSubject {
  id: string;
  name: string;
  maxMarks: number;
}

export interface SpreadsheetRow {
  id: string;
  studentName: string;
  rollNumber?: string;
  marks: Record<string, string>; // subjectId -> string representation of mark or "A" or ""
}

export interface ValidationErrorItem {
  rowIdx: number;
  studentName: string;
  subjectName: string;
  subjectId: string;
  cellValue: string;
  reason: string;
}

export interface SpreadsheetValidationSummary {
  totalStudents: number;
  totalSubjects: number;
  validMarks: number;
  missingMarks: number;
  invalidEntries: number;
  completeStudents: number;
  incompleteStudents: number;
  errors: ValidationErrorItem[];
}

export interface GraphGenerationRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherDesignation?: string;
  class: string;
  section: string;
  examinationName: string;
  academicSession: string;
  schoolName: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published';
  studentCount: number;
  subjectCount: number;
  subjects: SpreadsheetSubject[];
  rows: SpreadsheetRow[];
}

export interface SubjectGraphItem {
  studentName: string;
  rollNumber?: string;
  marksObtained: number | null;
  maxMarks: number;
  percentage: number | null;
  band: PerformanceBand;
  bandLabel: string;
  isAbsent: boolean;
  isInvalid: boolean;
  displayMark: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  performedBy: {
    role: UserRole;
    id: string;
    name: string;
  };
  action:
    | 'UPLOAD_BULK_MARKS'
    | 'UPDATE_MARK'
    | 'CREATE_STUDENT'
    | 'UPDATE_STUDENT'
    | 'DELETE_STUDENT'
    | 'CREATE_TEACHER'
    | 'UPDATE_TEACHER'
    | 'TOGGLE_TEACHER_STATUS'
    | 'CREATE_EXAM'
    | 'UPDATE_EXAM'
    | 'SAVE_GRAPH_PROJECT'
    | 'DELETE_GRAPH_PROJECT'
    | 'UPDATE_PROFILE'
    | 'UPDATE_SCHOOL_SETTINGS';
  details: string;
  metadata?: Record<string, any>;
}

export type PerformanceBand = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'GREY';

export interface CalculatedSubjectPerformance {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  obtained: number | null;
  percentage: number | null;
  band: PerformanceBand;
  bandLabel: string;
  isAbsent: boolean;
  isUnverified: boolean;
  remarks?: string;
}
