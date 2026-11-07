import {
  Teacher,
  StudentRecord,
  Examination,
  StudentMarksRecord,
  AuditLog,
  SchoolSettings,
  GraphGenerationRecord,
  SpreadsheetSubject,
  SpreadsheetRow,
  ClassConfig,
  Subject
} from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEYS = {
  TEACHERS: 'scorefuture_teachers_v2',
  STUDENTS: 'scorefuture_students_v2',
  EXAMS: 'scorefuture_exams_v2',
  MARKS: 'scorefuture_marks_v2',
  LOGS: 'scorefuture_logs_v2',
  CURRENT_USER: 'scorefuture_auth_user_v2',
  GRAPH_PROJECTS: 'scorefuture_graph_projects_v2',
  SCHOOL_SETTINGS: 'scorefuture_school_settings_v2',
  CLASS_CONFIGS: 'scorefuture_class_configs_v2',
};

const initialSchoolSettings: SchoolSettings = {
  schoolName: 'Surevin International Residential School, Niwari Modinagar',
  academicSession: '2026-2027',
  affiliationNumber: 'CBSE Affiliation No. 2130849',
  address: 'Niwari Road, Modinagar, Ghaziabad, Delhi-NCR',
  principalName: 'Dr. Sarita Sindhu',
};

// Flexible Class-Wise Subject Configurations (Admin Managed)
export const initialClassConfigs: ClassConfig[] = [
  {
    id: 'class-vi',
    name: 'XII',
    sections: ['PCM', 'Silver', 'Bronze'],
    academicSession: '2026-2027',
    subjects: [
      { id: 'sub-vi-eng', name: 'English', code: 'ENG-06', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-vi-hnd', name: 'Hindi', code: 'HND-06', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-vi-mth', name: 'Mathematics', code: 'MTH-06', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-vi-sci', name: 'Science', code: 'SCI-06', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-vi-sst', name: 'Social Studies', code: 'SST-06', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-vi-gk', name: 'General Knowledge', code: 'GK-06', maxMarks: 50, passingMarks: 20 },
      { id: 'sub-vi-cmp', name: 'Computer', code: 'CMP-06', maxMarks: 50, passingMarks: 20 },
    ],
  },
  {
    id: 'class-x',
    name: 'X',
    sections: ['Platinum', 'Gold', 'Silver'],
    academicSession: '2026-2027',
    subjects: [
      { id: 'sub-x-hnd', name: 'Hindi', code: 'HND-10', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-x-eng', name: 'English', code: 'ENG-10', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-x-mth', name: 'Mathematics', code: 'MTH-10', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-x-sci', name: 'Science', code: 'SCI-10', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-x-sst', name: 'Social Science', code: 'SST-10', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-x-it', name: 'Information Tech', code: 'IT-10', maxMarks: 50, passingMarks: 20 },
    ],
  },
  {
    id: 'class-xii-pcm',
    name: 'XII — PCM',
    sections: ['Science A', 'Science B'],
    academicSession: '2026-2027',
    subjects: [
      { id: 'sub-xii-phy', name: 'Physics', code: 'PHY-12', maxMarks: 70, passingMarks: 23 },
      { id: 'sub-xii-chm', name: 'Chemistry', code: 'CHM-12', maxMarks: 70, passingMarks: 23 },
      { id: 'sub-xii-mth', name: 'Mathematics', code: 'MTH-12', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-xii-eng', name: 'English', code: 'ENG-12', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-xii-ped', name: 'Physical Education', code: 'PED-12', maxMarks: 70, passingMarks: 23 },
    ],
  },
  {
    id: 'class-xii-pcb',
    name: 'XII — PCB',
    sections: ['Science C'],
    academicSession: '2026-2027',
    subjects: [
      { id: 'sub-xii-phy-b', name: 'Physics', code: 'PHY-12', maxMarks: 70, passingMarks: 23 },
      { id: 'sub-xii-chm-b', name: 'Chemistry', code: 'CHM-12', maxMarks: 70, passingMarks: 23 },
      { id: 'sub-xii-bio', name: 'Biology', code: 'BIO-12', maxMarks: 70, passingMarks: 23 },
      { id: 'sub-xii-eng-b', name: 'English', code: 'ENG-12', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-xii-ped-b', name: 'Physical Education', code: 'PED-12', maxMarks: 70, passingMarks: 23 },
    ],
  },
];

// Initial Seed Data
const initialTeachers: Teacher[] = [
  {
    id: 'tea-jyoti-panchal',
    teacherId: 'SF-TEA-J8M4Q6',
    name: 'Jyoti Panchal',
    email: 'jyoti.panchal@scorefuture.edu',
    password: 'jyoti123',
    designation: 'Senior Faculty (Mathematics & Science)',
    phone: '+91 98765 43210',
    assignedClass: 'VI',
    assignedSection: 'Gold',
    academicSession: '2026-2027',
    assignedSubjectIds: ['sub-vi-eng', 'sub-vi-hnd', 'sub-vi-mth', 'sub-vi-sci', 'sub-vi-gk', 'sub-vi-cmp'],
    department: 'Secondary Sciences',
    active: true,
    permissions: {
      canEditMarks: true,
      canExportReports: true,
      canAddStudents: true,
    },
    createdAt: '2025-06-15T09:00:00Z',
  },
 
  
  {
    id: 'tea-vikram-seth',
    teacherId: 'SF-TEA-V9P3Z5',
    name: 'Vikram Seth',
    email: 'vikram.seth@scorefuture.edu',
    designation: 'Faculty Accountancy & Economics',
    phone: '+91 97115 54433',
    assignedClass: 'XI',
    assignedSection: 'Commerce',
    department: 'Accountancy & Economics',
    active: false,
    permissions: {
      canEditMarks: false,
      canExportReports: true,
      canAddStudents: false,
    },
    createdAt: '2025-07-10T14:00:00Z',
  },
];

const initialExams: Examination[] = [
  {
    id: 'exam-midterm-2026',
    name: 'Mid-Term Examination 2026',
    academicSession: '2025-2026',
    startDate: '2026-09-15',
    endDate: '2026-09-28',
    status: 'active',
    subjects: [
      { id: 'sub-hindi', name: 'Hindi', code: 'HND-101', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-eng', name: 'English', code: 'ENG-101', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-math', name: 'Maths', code: 'MTH-101', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-sci', name: 'Science', code: 'SCI-101', maxMarks: 80, passingMarks: 32 },
    ],
  },
  {
    id: 'exam-annual-prep-2026',
    name: 'Annual Board Preparatory 2026',
    academicSession: '2025-2026',
    startDate: '2026-01-10',
    endDate: '2026-01-22',
    status: 'completed',
    subjects: [
      { id: 'sub-hindi', name: 'Hindi', code: 'HND-101', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-eng', name: 'English', code: 'ENG-101', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-math', name: 'Maths', code: 'MTH-101', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-sci', name: 'Science', code: 'SCI-101', maxMarks: 80, passingMarks: 32 },
    ],
  },
];

// 40 Students strictly under Jyoti Panchal (Class X – Platinum)
const studentNames40: string[] = [
  
];

function generateSeedStudents(): { students: StudentRecord[]; marks: StudentMarksRecord[] } {
  const students: StudentRecord[] = [];
  const marks: StudentMarksRecord[] = [];

  studentNames40.forEach((name, index) => {
    const roll = (101 + index).toString();
    const studentId = `stu-x-plat-${roll}`;
    
    students.push({
      id: studentId,
      name,
      rollNumber: roll,
      class: 'X',
      section: 'Platinum',
      assignedTeacherId: 'SF-TEA-J8M4Q6',
      assignedTeacherName: 'Jyoti Panchal',
      academicSession: '2025-2026',
      createdAt: '2025-06-20T08:00:00Z',
    });

    let hindi = 67;
    let eng = 72;
    let math = 65;
    let sci = 78;

    if (index === 0) { // Kartik
      hindi = 67; eng = 72; math = 65; sci = 78;
    } else if (index === 1) { // Ananya
      hindi = 60; eng = 70; math = 75; sci = 68;
    } else if (index === 2) { // Anjali
      hindi = 55; eng = 64; math = 71; sci = 72;
    } else if (index === 7) { // Bhavna
      hindi = 30; eng = 38; math = 29; sci = 35; // Red (<40%)
    } else if (index === 14) { // Hardik
      hindi = 42; eng = 45; math = 44; sci = 46; // Orange (40-60%)
    } else if (index === 24) { // Neha - Topper
      hindi = 78; eng = 77; math = 79; sci = 76; // Green (>80%)
    } else {
      const base = 48 + ((index * 5) % 28);
      hindi = Math.min(80, Math.max(22, base + (index % 7)));
      eng = Math.min(80, Math.max(25, base + ((index * 3) % 9)));
      math = Math.min(80, Math.max(20, base - (index % 6)));
      sci = Math.min(80, Math.max(24, base + 4));
    }

    marks.push({
      id: `mark-mt-${studentId}`,
      studentId: studentId,
      examId: 'exam-midterm-2026',
      marks: {
        'sub-hindi': { obtained: hindi },
        'sub-eng': { obtained: eng },
        'sub-math': { obtained: math },
        'sub-sci': { obtained: sci },
      },
      updatedAt: '2026-09-30T14:20:00Z',
      updatedBy: 'SF-TEA-J8M4Q6',
      updatedByName: 'Jyoti Panchal',
    });
  });

  return { students, marks };
}

// Initial Seed Graph Project for Jyoti Panchal
function generateInitialGraphProject(): GraphGenerationRecord {
  const subjects: SpreadsheetSubject[] = [
    { id: 'sub-hindi', name: 'Hindi', maxMarks: 80 },
    { id: 'sub-eng', name: 'English', maxMarks: 80 },
    { id: 'sub-math', name: 'Maths', maxMarks: 80 },
    { id: 'sub-sci', name: 'Science', maxMarks: 80 },
  ];

  const rows: SpreadsheetRow[] = [
    { id: 'row-1', studentName: '', rollNumber: '101', marks: { 'sub-hindi': '67', 'sub-eng': '72', 'sub-math': '65', 'sub-sci': '78' } },
    { id: 'row-2', studentName: '', rollNumber: '102', marks: { 'sub-hindi': '60', 'sub-eng': '70', 'sub-math': '75', 'sub-sci': '68' } },
    { id: 'row-3', studentName: '', rollNumber: '103', marks: { 'sub-hindi': '55', 'sub-eng': '64', 'sub-math': '71', 'sub-sci': '72' } },
    { id: 'row-4', studentName: '', rollNumber: '104', marks: { 'sub-hindi': '74', 'sub-eng': '76', 'sub-math': '78', 'sub-sci': '77' } },
    { id: 'row-5', studentName: '', rollNumber: '105', marks: { 'sub-hindi': '68', 'sub-eng': '71', 'sub-math': '70', 'sub-sci': '73' } },
    { id: 'row-6', studentName: '', rollNumber: '106', marks: { 'sub-hindi': '52', 'sub-eng': '58', 'sub-math': '49', 'sub-sci': '62' } },
    { id: 'row-7', studentName: '', rollNumber: '107', marks: { 'sub-hindi': '64', 'sub-eng': '69', 'sub-math': '72', 'sub-sci': '66' } },
    { id: 'row-8', studentName: '', rollNumber: '108', marks: { 'sub-hindi': '28', 'sub-eng': '35', 'sub-math': '26', 'sub-sci': '31' } },
    { id: 'row-9', studentName: '', rollNumber: '109', marks: { 'sub-hindi': '48', 'sub-eng': '52', 'sub-math': '44', 'sub-sci': '50' } },
    { id: 'row-10', studentName: '', rollNumber: '110', marks: { 'sub-hindi': '62', 'sub-eng': '66', 'sub-math': '68', 'sub-sci': '70' } },
    { id: 'row-11', studentName: '', rollNumber: '111', marks: { 'sub-hindi': '59', 'sub-eng': 'A', 'sub-math': '63', 'sub-sci': '65' } },
    { id: 'row-12', studentName: '', rollNumber: '112', marks: { 'sub-hindi': '38', 'sub-eng': '44', 'sub-math': '36', 'sub-sci': '41' } },
    { id: 'row-13', studentName: '', rollNumber: '113', marks: { 'sub-hindi': '78', 'sub-eng': '76', 'sub-math': '79', 'sub-sci': '78' } },
    { id: 'row-14', studentName: '', rollNumber: '114', marks: { 'sub-hindi': '50', 'sub-eng': '54', 'sub-math': '56', 'sub-sci': '52' } },
    { id: 'row-15', studentName: '', rollNumber: '115', marks: { 'sub-hindi': '66', 'sub-eng': '68', 'sub-math': '70', 'sub-sci': '67' } },
  ];

  return {
    id: 'proj-midterm-x-plat',
    teacherId: 'SF-TEA-J8M4Q6',
    teacherName: 'Jyoti Panchal',
    teacherDesignation: 'Senior Secondary Teacher (Mathematics & Science)',
    class: 'X',
    section: 'Platinum',
    examinationName: 'Mid-Term Examination 2026',
    academicSession: '2025-2026',
    schoolName: 'Surevin International Residential School, Niwari Modinagar',
    createdAt: '2026-09-30T10:00:00Z',
    updatedAt: '2026-09-30T14:30:00Z',
    status: 'published',
    studentCount: rows.length,
    subjectCount: subjects.length,
    subjects,
    rows,
  };
}

const initialLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-30T14:30:00Z',
    performedBy: {
      role: 'TEACHER',
      id: 'SF-TEA-J8M4Q6',
      name: 'Jyoti Panchal',
    },
    action: 'SAVE_GRAPH_PROJECT',
    details: 'Generated and published subject-wise performance graphs for Class X – Platinum (Mid-Term Examination 2026).',
    metadata: { class: 'X', section: 'Platinum', subjectCount: 4, studentCount: 15 },
  },
];

export const StorageService = {
  getSchoolSettings(): SchoolSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOL_SETTINGS);
    if (!raw || raw.includes('ScoreFuture Model')) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(initialSchoolSettings));
      return initialSchoolSettings;
    }
    return JSON.parse(raw);
  },

  saveSchoolSettings(settings: SchoolSettings): void {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(settings));
    setDoc(doc(db, 'schoolSettings', 'main'), settings).catch((err) => {
      console.warn('Firestore saveSchoolSettings skipped:', err);
    });
  },

  getTeachers(): Teacher[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(initialTeachers));
      return initialTeachers;
    }
    return JSON.parse(raw);
  },

  saveTeachers(teachers: Teacher[]): void {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    // Persist full roster and individual documents to Firestore
    setDoc(doc(db, 'teachers', 'all_roster'), { list: teachers }).catch(() => {});
    teachers.forEach((t) => {
      if (t.teacherId) {
        setDoc(doc(db, 'teachers', t.teacherId), t).catch(() => {});
      }
    });
  },

  addTeacher(teacher: Teacher): void {
    const teachers = this.getTeachers();
    const existingIdx = teachers.findIndex(
      (t) => t.teacherId.toLowerCase() === teacher.teacherId.toLowerCase() || t.email.toLowerCase() === teacher.email.toLowerCase()
    );
    if (existingIdx >= 0) {
      teachers[existingIdx] = { ...teachers[existingIdx], ...teacher };
    } else {
      teachers.unshift(teacher);
    }
    this.saveTeachers(teachers);
  },

  async syncFromFirestore(): Promise<void> {
    try {
      // 1. School settings
      const schoolSnap = await getDoc(doc(db, 'schoolSettings', 'main')).catch(() => null);
      if (schoolSnap && schoolSnap.exists()) {
        localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(schoolSnap.data()));
      }

      // 2. Class configs
      const classSnap = await getDoc(doc(db, 'classConfigs', 'current')).catch(() => null);
      if (classSnap && classSnap.exists() && classSnap.data().list) {
        localStorage.setItem(STORAGE_KEYS.CLASS_CONFIGS, JSON.stringify(classSnap.data().list));
      }

      // 3. Teachers roster
      const teachersSnap = await getDoc(doc(db, 'teachers', 'all_roster')).catch(() => null);
      if (teachersSnap && teachersSnap.exists() && teachersSnap.data().list) {
        const cloudTeachers: Teacher[] = teachersSnap.data().list;
        const localTeachers = this.getTeachers();
        const merged = [...localTeachers];
        cloudTeachers.forEach((ct) => {
          const idx = merged.findIndex(
            (m) => m.teacherId.toLowerCase() === ct.teacherId.toLowerCase() || m.email.toLowerCase() === ct.email.toLowerCase()
          );
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...ct };
          } else {
            merged.push(ct);
          }
        });
        localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(merged));
      }

      // 4. Exams
      const examsSnap = await getDoc(doc(db, 'exams', 'all_exams')).catch(() => null);
      if (examsSnap && examsSnap.exists() && examsSnap.data().list) {
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(examsSnap.data().list));
      }

      // 5. Students
      const studentsSnap = await getDoc(doc(db, 'students', 'all_students')).catch(() => null);
      if (studentsSnap && studentsSnap.exists() && studentsSnap.data().list) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(studentsSnap.data().list));
      }

      // 6. Marks
      const marksSnap = await getDoc(doc(db, 'marks', 'all_marks')).catch(() => null);
      if (marksSnap && marksSnap.exists() && marksSnap.data().list) {
        localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(marksSnap.data().list));
      }

      // 7. Graph Projects
      const projectsSnap = await getDoc(doc(db, 'graphProjects', 'all_projects')).catch(() => null);
      if (projectsSnap && projectsSnap.exists() && projectsSnap.data().list) {
        localStorage.setItem(STORAGE_KEYS.GRAPH_PROJECTS, JSON.stringify(projectsSnap.data().list));
      }
    } catch (err) {
      console.warn('syncFromFirestore failed or offline:', err);
    }
  },

  updateTeacherProfile(teacherIdOrId: string, updates: Partial<Teacher>): Teacher | null {
    const teachers = this.getTeachers();
    const idx = teachers.findIndex((t) => t.id === teacherIdOrId || t.teacherId === teacherIdOrId);
    if (idx === -1) return null;

    // Do NOT allow changing teacherId or assigned class/section or permissions from teacher profile
    const safeUpdates: Partial<Teacher> = {
      name: updates.name !== undefined ? updates.name : teachers[idx].name,
      designation: updates.designation !== undefined ? updates.designation : teachers[idx].designation,
      phone: updates.phone !== undefined ? updates.phone : teachers[idx].phone,
      department: updates.department !== undefined ? updates.department : teachers[idx].department,
    };

    teachers[idx] = { ...teachers[idx], ...safeUpdates };
    this.saveTeachers(teachers);

    // Update currentUser in session if it's the active user
    const currentAuth = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentAuth) {
      try {
        const parsed = JSON.parse(currentAuth);
        if (parsed.teacherId === teachers[idx].teacherId || parsed.id === teachers[idx].id) {
          parsed.name = teachers[idx].name;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
        }
      } catch (e) {
        // ignore
      }
    }

    return teachers[idx];
  },

  getStudents(): StudentRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      const { students, marks } = generateSeedStudents();
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(marks));
      return students;
    }
    return JSON.parse(raw);
  },

  saveStudents(students: StudentRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    setDoc(doc(db, 'students', 'all_students'), { list: students }).catch(() => {});
  },

  getExams(): Examination[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(initialExams));
      return initialExams;
    }
    return JSON.parse(raw);
  },

  saveExams(exams: Examination[]): void {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    setDoc(doc(db, 'exams', 'all_exams'), { list: exams }).catch(() => {});
  },

  getMarks(): StudentMarksRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MARKS);
    if (!raw) {
      const { students, marks } = generateSeedStudents();
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(marks));
      return marks;
    }
    return JSON.parse(raw);
  },

  saveMarks(marks: StudentMarksRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(marks));
    setDoc(doc(db, 'marks', 'all_marks'), { list: marks }).catch(() => {});
  },

  getLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(raw);
  },

  addLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ...log,
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    setDoc(doc(db, 'auditLogs', newLog.id), newLog).catch(() => {});
  },

  // Graph Projects History
  getGraphProjects(): GraphGenerationRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GRAPH_PROJECTS);
    if (!raw) {
      const initialProject = generateInitialGraphProject();
      localStorage.setItem(STORAGE_KEYS.GRAPH_PROJECTS, JSON.stringify([initialProject]));
      return [initialProject];
    }
    return JSON.parse(raw);
  },

  saveGraphProjects(projects: GraphGenerationRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.GRAPH_PROJECTS, JSON.stringify(projects));
    setDoc(doc(db, 'graphProjects', 'all_projects'), { list: projects }).catch(() => {});
  },

  getGraphProjectById(id: string): GraphGenerationRecord | null {
    const projects = this.getGraphProjects();
    return projects.find((p) => p.id === id) || null;
  },

  saveGraphProject(project: GraphGenerationRecord): void {
    const projects = this.getGraphProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      projects.unshift({
        ...project,
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.saveGraphProjects(projects);
  },

  deleteGraphProject(id: string): void {
    const projects = this.getGraphProjects();
    const updated = projects.filter((p) => p.id !== id);
    this.saveGraphProjects(updated);
  },

  // Class & Subject Management (Admin Configured)
  getClassConfigs(): ClassConfig[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASS_CONFIGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLASS_CONFIGS, JSON.stringify(initialClassConfigs));
      return initialClassConfigs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialClassConfigs;
    }
  },

  saveClassConfigs(configs: ClassConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASS_CONFIGS, JSON.stringify(configs));
    setDoc(doc(db, 'classConfigs', 'current'), { list: configs }).catch(() => {});
  },

  getClassConfig(className: string): ClassConfig | undefined {
    const configs = this.getClassConfigs();
    const clean = className.trim().toLowerCase();
    return configs.find((c) => c.name.toLowerCase() === clean || c.name.toLowerCase().startsWith(clean));
  },

  /**
   * Automatically resolves assigned subjects with specific maxMarks for a teacher
   */
  getTeacherAssignedSubjects(teacher: Teacher): Subject[] {
    const config = this.getClassConfig(teacher.assignedClass);
    if (config && config.subjects && config.subjects.length > 0) {
      if (teacher.assignedSubjectIds && teacher.assignedSubjectIds.length > 0) {
        const filtered = config.subjects.filter((s) => teacher.assignedSubjectIds?.includes(s.id));
        if (filtered.length > 0) return filtered;
      }
      return config.subjects;
    }
    if (teacher.assignedSubjects && teacher.assignedSubjects.length > 0) {
      return teacher.assignedSubjects;
    }
    // Fallback standard subjects
    return [
      { id: 'sub-eng', name: 'English', code: 'ENG', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-hnd', name: 'Hindi', code: 'HND', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-mth', name: 'Mathematics', code: 'MTH', maxMarks: 80, passingMarks: 32 },
      { id: 'sub-sci', name: 'Science', code: 'SCI', maxMarks: 80, passingMarks: 32 },
    ];
  },

  /**
   * Aggregates student exam history across all examinations for student record profile
   */
  getStudentExamHistory(studentId: string) {
    const exams = this.getExams();
    const marks = this.getMarks().filter((m) => m.studentId === studentId);
    
    return exams.map((exam) => {
      const markRecord = marks.find((m) => m.examId === exam.id);
      let totalObt = 0;
      let totalMax = 0;
      let hasMarks = false;

      const subjectBreakdown = exam.subjects.map((sub) => {
        const entry = markRecord?.marks?.[sub.id];
        const isAbsent = !!entry?.isAbsent;
        const obtained = entry?.obtained ?? null;
        const pct = obtained !== null && sub.maxMarks > 0 ? Math.round((obtained / sub.maxMarks) * 1000) / 10 : null;

        if (obtained !== null && !isAbsent) {
          totalObt += obtained;
          totalMax += sub.maxMarks;
          hasMarks = true;
        }

        return {
          subject: sub,
          obtained,
          percentage: pct,
          isAbsent,
        };
      });

      const overallPercentage = totalMax > 0 && hasMarks ? Math.round((totalObt / totalMax) * 1000) / 10 : null;

      return {
        exam,
        hasRecord: !!markRecord,
        overallPercentage,
        totalObtained: totalObt,
        totalMaxMarks: totalMax,
        subjectBreakdown,
        updatedAt: markRecord?.updatedAt,
      };
    }).filter((h) => h.hasRecord);
  },

  // Production Data Cleanup: Preview & Purge demo seed records
  previewDemoData() {
    const students = this.getStudents();
    const marks = this.getMarks();
    const projects = this.getGraphProjects();
    const teachers = this.getTeachers();

    const demoStudents = students.filter((s) => s.id.startsWith('stu-') || s.name === 'Kartik' || s.name === 'Ananya');
    const demoMarks = marks.filter((m) => m.id.startsWith('marks-seed-'));
    const demoProjects = projects.filter((p) => p.id.startsWith('proj-seed-'));
    const demoTeachers = teachers.filter((t) => t.id === 'tea-vikram-seth');

    return {
      totalStudents: students.length,
      demoStudentsCount: demoStudents.length,
      genuineStudentsCount: students.length - demoStudents.length,
      totalMarksCount: marks.length,
      demoMarksCount: demoMarks.length,
      totalProjectsCount: projects.length,
      demoProjectsCount: demoProjects.length,
      demoTeachersCount: demoTeachers.length,
    };
  },

  backupAllData(): string {
    const data = {
      backupTimestamp: new Date().toISOString(),
      schoolSettings: this.getSchoolSettings(),
      classConfigs: this.getClassConfigs(),
      teachers: this.getTeachers(),
      students: this.getStudents(),
      exams: this.getExams(),
      marks: this.getMarks(),
      graphProjects: this.getGraphProjects(),
      logs: this.getLogs(),
    };
    return JSON.stringify(data, null, 2);
  },

  cleanupDemoData() {
    const preview = this.previewDemoData();
    const students = this.getStudents().filter((s) => !(s.id.startsWith('stu-') || s.name === 'Kartik' || s.name === 'Ananya'));
    const marks = this.getMarks().filter((m) => !m.id.startsWith('marks-seed-'));
    const projects = this.getGraphProjects().filter((p) => !p.id.startsWith('proj-seed-'));
    const teachers = this.getTeachers().filter((t) => t.id !== 'tea-vikram-seth');

    this.saveStudents(students);
    this.saveMarks(marks);
    this.saveGraphProjects(projects);
    this.saveTeachers(teachers);

    this.addLog({
      performedBy: {
        role: 'ADMIN',
        id: 'SF-ADM-001',
        name: 'Mr. Sharukh Tyagi (Administrator)',
      },
      action: 'CLEANUP_DEMO_DATA',
      details: 'Cleaned up demo students, placeholder marks, and sample graph projects for production readiness.',
    });

    return {
      purgedStudents: preview.demoStudentsCount,
      purgedTeachers: preview.demoTeachersCount,
      purgedMarks: preview.demoMarksCount,
      purgedProjects: preview.demoProjectsCount,
    };
  },

  resetToDefaultData(): void {
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.MARKS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.GRAPH_PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CLASS_CONFIGS);
    this.getSchoolSettings();
    this.getClassConfigs();
    this.getTeachers();
    this.getStudents();
    this.getExams();
    this.getMarks();
    this.getLogs();
    this.getGraphProjects();
  },
};
