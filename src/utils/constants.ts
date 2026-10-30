import { PerformanceBand, CalculatedSubjectPerformance, Subject, SubjectMarkEntry } from '../types';

export const PERFORMANCE_COLORS: Record<PerformanceBand, {
  name: string;
  bg: string;
  text: string;
  border: string;
  fillHex: string;
  description: string;
}> = {
  GREEN: {
    name: 'Above 80%',
    bg: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-600',
    fillHex: '#10B981',
    description: 'Excellent (Above 80%)'
  },
  YELLOW: {
    name: '60% to 80%',
    bg: 'bg-amber-400',
    text: 'text-amber-800',
    border: 'border-amber-500',
    fillHex: '#F59E0B',
    description: 'Proficient (60% – 80%)'
  },
  ORANGE: {
    name: '40% to < 60%',
    bg: 'bg-orange-500',
    text: 'text-orange-700',
    border: 'border-orange-600',
    fillHex: '#F97316',
    description: 'Developing (40% – < 60%)'
  },
  RED: {
    name: 'Below 40%',
    bg: 'bg-rose-500',
    text: 'text-rose-700',
    border: 'border-rose-600',
    fillHex: '#EF4444',
    description: 'Critical / Remedial (< 40%)'
  },
  GREY: {
    name: 'Missing / Absent',
    bg: 'bg-slate-400',
    text: 'text-slate-600',
    border: 'border-slate-400',
    fillHex: '#94A3B8',
    description: 'Unverified / Absent / No Data'
  }
};

/**
 * Calculates percentage and performance band according to ScoreFuture rules:
 * - Red: below 40%
 * - Orange: 40% to below 60%
 * - Yellow: 60% through 80%
 * - Green: above 80%
 * - Grey: missing, absent, or unverified
 */
export function calculateSubjectPerformance(
  subject: Subject,
  entry?: SubjectMarkEntry
): CalculatedSubjectPerformance {
  if (!entry || entry.isAbsent || entry.isUnverified || entry.obtained === null || entry.obtained === undefined) {
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      maxMarks: subject.maxMarks,
      obtained: entry?.obtained ?? null,
      percentage: null,
      band: 'GREY',
      bandLabel: entry?.isAbsent ? 'Absent' : entry?.isUnverified ? 'Unverified' : 'Missing',
      isAbsent: !!entry?.isAbsent,
      isUnverified: !!entry?.isUnverified,
      remarks: entry?.remarks
    };
  }

  const rawPercent = (entry.obtained / subject.maxMarks) * 100;
  const percentage = Math.round(rawPercent * 10) / 10;

  let band: PerformanceBand = 'GREY';
  let bandLabel = '';

  if (percentage > 80) {
    band = 'GREEN';
    bandLabel = 'Above 80%';
  } else if (percentage >= 60 && percentage <= 80) {
    band = 'YELLOW';
    bandLabel = '60% – 80%';
  } else if (percentage >= 40 && percentage < 60) {
    band = 'ORANGE';
    bandLabel = '40% – < 60%';
  } else {
    band = 'RED';
    bandLabel = 'Below 40%';
  }

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    maxMarks: subject.maxMarks,
    obtained: entry.obtained,
    percentage,
    band,
    bandLabel,
    isAbsent: false,
    isUnverified: false,
    remarks: entry.remarks
  };
}

/**
 * Sorts subject performances in strictly INCREASING percentage order.
 * Lowest percentage on the left.
 * Highest percentage on the right.
 * Missing or absent entries at the end.
 * Equal percentages preserve original student-list order.
 */
export function sortPerformancesAscending(items: CalculatedSubjectPerformance[]): CalculatedSubjectPerformance[] {
  return [...items].sort((a, b) => {
    // Both have valid percentages -> lowest first (increasing order)
    if (a.percentage !== null && b.percentage !== null) {
      return a.percentage - b.percentage;
    }
    // a has percentage, b is missing/absent -> a comes first
    if (a.percentage !== null && b.percentage === null) {
      return -1;
    }
    // b has percentage, a is missing/absent -> b comes first
    if (a.percentage === null && b.percentage !== null) {
      return 1;
    }
    return 0;
  });
}

/**
 * Sorts subject performances in strictly decreasing percentage order.
 */
export function sortPerformancesDescending(items: CalculatedSubjectPerformance[]): CalculatedSubjectPerformance[] {
  return [...items].sort((a, b) => {
    if (a.percentage !== null && b.percentage !== null) {
      return b.percentage - a.percentage;
    }
    if (a.percentage !== null && b.percentage === null) {
      return -1;
    }
    if (a.percentage === null && b.percentage !== null) {
      return 1;
    }
    return a.subjectName.localeCompare(b.subjectName);
  });
}

/**
 * Helper to generate unique teacher IDs like "SF-TEA-J8M4Q6"
 */
export function generateTeacherId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SF-TEA-${code}`;
}

/**
 * Helper to generate UUIDs
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'sf-id-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}
