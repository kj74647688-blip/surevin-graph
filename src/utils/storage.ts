import {
  Teacher,
  StudentRecord,
  Examination,
  StudentMarksRecord,
  AuditLog,
  SchoolSettings,
  GraphGenerationRecord,
  SpreadsheetSubject,
  SpreadsheetRow
} from '../types';

const STORAGE_KEYS = {
  TEACHERS: 'scorefuture_teachers_v2',
  STUDENTS: 'scorefuture_students_v2',
  EXAMS: 'scorefuture_exams_v2',
  MARKS: 'scorefuture_marks_v2',
  LOGS: 'scorefuture_logs_v2',
  CURRENT_USER: 'scorefuture_auth_user_v2',
  GRAPH_PROJECTS: 'scorefuture_graph_projects_v2',
  SCHOOL_SETTINGS: 'scorefuture_school_settings_v2',
};

const initialSchoolSettings: SchoolSettings = {
  schoolName: 'Surevin International Residential School, Niwari Modinagar',
  academicSession: '2025-2026',
  affiliationNumber: 'CBSE Affiliation No. 2130849',
  address: 'Niwari Road, Modinagar, Ghaziabad, Delhi-NCR',
  principalName: 'Dr. Alok Verma',
};

// Initial Seed Data
const initialTeachers: Teacher[] = [
  {
    id: 'tea-jyoti-panchal',
    teacherId: 'SF-TEA-J8M4Q6',
    name: 'Jyoti Panchal',
    email: 'jyoti.panchal@scorefuture.edu',
    designation: 'Senior Secondary Teacher (Mathematics & Science)',
    phone: '+91 98765 43210',
    assignedClass: 'X',
    assignedSection: 'Platinum',
    department: 'Mathematics & Science',
    active: true,
    permissions: {
      canEditMarks: true,
      canExportReports: true,
      canAddStudents: true,
    },
    createdAt: '2025-06-15T09:00:00Z',
  },
  {
    id: 'tea-rajesh-sharma',
    teacherId: 'SF-TEA-R4K9L2',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@scorefuture.edu',
    designation: 'PGT Physics Faculty',
    phone: '+91 98112 33445',
    assignedClass: 'IX',
    assignedSection: 'Diamond',
    department: 'Physics',
    active: true,
    permissions: {
      canEditMarks: true,
      canExportReports: true,
      canAddStudents: true,
    },
    createdAt: '2025-06-18T10:30:00Z',
  },
  {
    id: 'tea-anita-desai',
    teacherId: 'SF-TEA-A2M7X1',
    name: 'Anita Desai',
    email: 'anita.desai@scorefuture.edu',
    designation: 'Senior Faculty Chemistry',
    phone: '+91 99220 88776',
    assignedClass: 'XII',
    assignedSection: 'Science A',
    department: 'Chemistry',
    active: true,
    permissions: {
      canEditMarks: true,
      canExportReports: true,
      canAddStudents: true,
    },
    createdAt: '2025-07-01T11:15:00Z',
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
const studentNames40 = [
  'Kartik Sharma', 'Ananya Iyer', 'Anjali Nair', 'Aarav Sharma', 'Aditi Verma',
  'Akash Patel', 'Aryan Gupta', 'Bhavna Kulkarni', 'Chirag Reddy', 'Devika Pillai',
  'Divyansh Mehta', 'Esha Choudhury', 'Farhan Akhtar', 'Gauri Deshmukh', 'Hardik Pandya',
  'Harshita Sen', 'Ishaan Malhotra', 'Jasmine Kaur', 'Kabir Das', 'Karan Johar',
  'Manasvi Joshi', 'Mayank Agarwal', 'Meera Rajput', 'Naveen Kumar', 'Neha Saxena',
  'Nikhil Rao', 'Payal Singhania', 'Pranav Mishra', 'Pooja Bhatt', 'Raghav Bansal',
  'Rhea Kapoor', 'Rohan Roy', 'Sanya Mirchandani', 'Siddharth Basu', 'Sneha Ganguly',
  'Tanvi Chawla', 'Tarun Bhatia', 'Urvi Parekh', 'Varun Dhawan', 'Vidya Balan'
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
    { id: 'row-1', studentName: 'Kartik', rollNumber: '101', marks: { 'sub-hindi': '67', 'sub-eng': '72', 'sub-math': '65', 'sub-sci': '78' } },
    { id: 'row-2', studentName: 'Ananya', rollNumber: '102', marks: { 'sub-hindi': '60', 'sub-eng': '70', 'sub-math': '75', 'sub-sci': '68' } },
    { id: 'row-3', studentName: 'Anjali', rollNumber: '103', marks: { 'sub-hindi': '55', 'sub-eng': '64', 'sub-math': '71', 'sub-sci': '72' } },
    { id: 'row-4', studentName: 'Aarav Sharma', rollNumber: '104', marks: { 'sub-hindi': '74', 'sub-eng': '76', 'sub-math': '78', 'sub-sci': '77' } },
    { id: 'row-5', studentName: 'Aditi Verma', rollNumber: '105', marks: { 'sub-hindi': '68', 'sub-eng': '71', 'sub-math': '70', 'sub-sci': '73' } },
    { id: 'row-6', studentName: 'Akash Patel', rollNumber: '106', marks: { 'sub-hindi': '52', 'sub-eng': '58', 'sub-math': '49', 'sub-sci': '62' } },
    { id: 'row-7', studentName: 'Aryan Gupta', rollNumber: '107', marks: { 'sub-hindi': '64', 'sub-eng': '69', 'sub-math': '72', 'sub-sci': '66' } },
    { id: 'row-8', studentName: 'Bhavna Kulkarni', rollNumber: '108', marks: { 'sub-hindi': '28', 'sub-eng': '35', 'sub-math': '26', 'sub-sci': '31' } },
    { id: 'row-9', studentName: 'Chirag Reddy', rollNumber: '109', marks: { 'sub-hindi': '48', 'sub-eng': '52', 'sub-math': '44', 'sub-sci': '50' } },
    { id: 'row-10', studentName: 'Devika Pillai', rollNumber: '110', marks: { 'sub-hindi': '62', 'sub-eng': '66', 'sub-math': '68', 'sub-sci': '70' } },
    { id: 'row-11', studentName: 'Divyansh Mehta', rollNumber: '111', marks: { 'sub-hindi': '59', 'sub-eng': 'A', 'sub-math': '63', 'sub-sci': '65' } },
    { id: 'row-12', studentName: 'Hardik Pandya', rollNumber: '112', marks: { 'sub-hindi': '38', 'sub-eng': '44', 'sub-math': '36', 'sub-sci': '41' } },
    { id: 'row-13', studentName: 'Neha Saxena', rollNumber: '113', marks: { 'sub-hindi': '78', 'sub-eng': '76', 'sub-math': '79', 'sub-sci': '78' } },
    { id: 'row-14', studentName: 'Rohan Roy', rollNumber: '114', marks: { 'sub-hindi': '50', 'sub-eng': '54', 'sub-math': '56', 'sub-sci': '52' } },
    { id: 'row-15', studentName: 'Sneha Ganguly', rollNumber: '115', marks: { 'sub-hindi': '66', 'sub-eng': '68', 'sub-math': '70', 'sub-sci': '67' } },
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

  resetToDefaultData(): void {
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.MARKS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.GRAPH_PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_SETTINGS);
    this.getSchoolSettings();
    this.getTeachers();
    this.getStudents();
    this.getExams();
    this.getMarks();
    this.getLogs();
    this.getGraphProjects();
  },
};
