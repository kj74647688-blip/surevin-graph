import React, { useMemo } from 'react';
import { StudentRecord, Examination, StudentMarksRecord, Teacher } from '../../types';
import { StorageService } from '../../utils/storage';
import { ExportService } from '../../utils/exportUtils';
import {
  X,
  GraduationCap,
  TrendingUp,
  Award,
  AlertTriangle,
  Download,
  Calendar,
  BookOpen,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { ShareReportModal } from './ShareReportModal';

interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  teacher?: Teacher | null;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  isOpen,
  onClose,
  student,
  teacher,
}) => {
  const [isShareOpen, setIsShareOpen] = React.useState(false);

  if (!isOpen) return null;

  const exams = StorageService.getExams();
  const allMarks = StorageService.getMarks().filter((m) => m.studentId === student.id);
  const graphProjects = StorageService.getGraphProjects().filter(
    (p) => p.class === student.class && p.section === student.section
  );

  // Compile exam history items
  const historyItems = useMemo(() => {
    return exams.map((ex) => {
      const markRec = allMarks.find((m) => m.examId === ex.id);
      
      let totalObtained = 0;
      let totalMax = 0;
      let subjectsEvaluated = 0;

      const subjectDetails = ex.subjects.map((sub) => {
        const entry = markRec?.marks?.[sub.id];
        const isAbsent = !!entry?.isAbsent;
        const obtained = entry?.obtained ?? null;
        const percentage = obtained !== null && sub.maxMarks > 0 
          ? Math.round((obtained / sub.maxMarks) * 1000) / 10 
          : null;

        if (percentage !== null) {
          totalObtained += obtained!;
          totalMax += sub.maxMarks;
          subjectsEvaluated++;
        }

        let bandColor = 'bg-slate-100 text-slate-700 border-slate-200';
        let bandLabel = isAbsent ? 'Absent' : 'Pending';

        if (percentage !== null) {
          if (percentage > 80) {
            bandColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            bandLabel = 'Above 80%';
          } else if (percentage >= 60) {
            bandColor = 'bg-amber-50 text-amber-800 border-amber-200';
            bandLabel = '60%–80%';
          } else if (percentage >= 40) {
            bandColor = 'bg-orange-50 text-orange-800 border-orange-200';
            bandLabel = '40%–<60%';
          } else {
            bandColor = 'bg-rose-50 text-rose-800 border-rose-200';
            bandLabel = 'Below 40%';
          }
        }

        return {
          subjectName: sub.name,
          maxMarks: sub.maxMarks,
          marksObtained: obtained,
          percentage,
          displayValue: isAbsent ? 'ABS' : obtained !== null ? `${obtained}` : '—',
          bandColor,
          bandLabel,
        };
      });

      const overallPercentage = totalMax > 0 
        ? Math.round((totalObtained / totalMax) * 1000) / 10 
        : null;

      return {
        exam: ex,
        markRec,
        hasRecord: !!markRec,
        totalObtained,
        totalMax,
        overallPercentage,
        subjectsEvaluated,
        subjectDetails,
      };
    });
  }, [exams, allMarks]);

  // Overall analytics across examinations
  const overallStats = useMemo(() => {
    const validExams = historyItems.filter((h) => h.overallPercentage !== null);
    if (validExams.length === 0) {
      return {
        averagePercentage: null,
        bestSubject: null as { name: string; score: number } | null,
        weakSubject: null as { name: string; score: number } | null,
      };
    }

    const avg = Math.round(
      (validExams.reduce((sum, e) => sum + (e.overallPercentage ?? 0), 0) / validExams.length) * 10
    ) / 10;

    // Aggregate by subject name
    const subjectScores: Record<string, { totalPct: number; count: number }> = {};
    validExams.forEach((e) => {
      e.subjectDetails.forEach((sd) => {
        if (sd.percentage !== null) {
          if (!subjectScores[sd.subjectName]) {
            subjectScores[sd.subjectName] = { totalPct: 0, count: 0 };
          }
          subjectScores[sd.subjectName].totalPct += sd.percentage;
          subjectScores[sd.subjectName].count++;
        }
      });
    });

    let best: { name: string; score: number } | null = null;
    let weak: { name: string; score: number } | null = null;

    Object.entries(subjectScores).forEach(([name, data]) => {
      const subjectAvg = Math.round((data.totalPct / data.count) * 10) / 10;
      if (!best || subjectAvg > best.score) {
        best = { name, score: subjectAvg };
      }
      if (!weak || subjectAvg < weak.score) {
        weak = { name, score: subjectAvg };
      }
    });

    return {
      averagePercentage: avg,
      bestSubject: best,
      weakSubject: weak,
    };
  }, [historyItems]);

  const handleDownloadReport = () => {
    const activeExam = exams[0];
    const markRec = allMarks.find((m) => m.examId === activeExam?.id);
    if (activeExam) {
      const performances = activeExam.subjects.map((sub) => {
        const entry = markRec?.marks?.[sub.id];
        const obtained = entry?.obtained ?? null;
        const pct = obtained !== null && sub.maxMarks > 0 ? Math.round((obtained / sub.maxMarks) * 1000) / 10 : null;
        let band: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'GREY' = 'GREY';
        let bandLabel = 'Pending';
        if (entry?.isAbsent) {
          band = 'GREY';
          bandLabel = 'Absent';
        } else if (pct !== null) {
          if (pct > 80) { band = 'GREEN'; bandLabel = 'Above 80%'; }
          else if (pct >= 60) { band = 'YELLOW'; bandLabel = '60%–80%'; }
          else if (pct >= 40) { band = 'ORANGE'; bandLabel = '40%–<60%'; }
          else { band = 'RED'; bandLabel = 'Below 40%'; }
        }
        return {
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code,
          maxMarks: sub.maxMarks,
          obtained,
          percentage: pct,
          band,
          bandLabel,
          isAbsent: !!entry?.isAbsent,
          isUnverified: obtained === null && !entry?.isAbsent,
        };
      });
      ExportService.exportIndividualStudentPDF(student, activeExam, performances, teacher || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        {/* Header with Surevin Branding */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center text-amber-400 font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xs uppercase tracking-wider font-bold text-amber-300 font-mono">
                Student Examination History & Academic Progress
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">{student.name}</h3>
              <p className="text-xs text-blue-200/90 mt-0.5">
                Roll No: <span className="font-mono font-bold text-white">{student.rollNumber}</span> · Class{' '}
                {student.class} – {student.section} · Session: {student.academicSession || '2026-2027'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Assigned Teacher</div>
              <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                {student.assignedTeacherName || teacher?.name || 'Assigned Class Teacher'}
              </div>
              <div className="text-3xs text-slate-500 font-mono">{student.assignedTeacherId}</div>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-2xs font-bold text-blue-700 uppercase tracking-wider">Cumulative Average</div>
              <div className="text-xl font-black text-blue-900 font-mono mt-0.5">
                {overallStats.averagePercentage !== null ? `${overallStats.averagePercentage}%` : 'N/A'}
              </div>
              <div className="text-3xs text-blue-700">Across all completed exams</div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-2xs font-bold text-emerald-700 uppercase tracking-wider">Strongest Subject</div>
              <div className="text-sm font-bold text-emerald-900 mt-1 truncate">
                {overallStats.bestSubject ? `${overallStats.bestSubject.name} (${overallStats.bestSubject.score}%)` : '—'}
              </div>
              <div className="text-3xs text-emerald-700">Top performance band</div>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
              <div className="text-2xs font-bold text-rose-700 uppercase tracking-wider">Attention Needed</div>
              <div className="text-sm font-bold text-rose-900 mt-1 truncate">
                {overallStats.weakSubject ? `${overallStats.weakSubject.name} (${overallStats.weakSubject.score}%)` : '—'}
              </div>
              <div className="text-3xs text-rose-700">Focus for improvement</div>
            </div>
          </div>

          {/* Remarks banner if any */}
          {student.remarks && (
            <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900">
              <span className="font-bold">Teacher Academic Remarks: </span>
              <span>{student.remarks}</span>
            </div>
          )}

          {/* Examinations Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Examination History Breakdown
            </h4>

            {historyItems.map((item) => (
              <div
                key={item.exam.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
              >
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.exam.name}</span>
                    <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {item.exam.academicSession}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {item.overallPercentage !== null ? (
                      <span className="font-mono font-bold text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Exam Total: {item.totalObtained} / {item.totalMax} ({item.overallPercentage}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Marks Not Uploaded</span>
                    )}
                  </div>
                </div>

                {/* Subject Table */}
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-3xs font-bold uppercase text-slate-400">
                        <th className="pb-2">Subject</th>
                        <th className="pb-2 text-right">Max Marks</th>
                        <th className="pb-2 text-right">Marks Obtained</th>
                        <th className="pb-2 text-right">Percentage</th>
                        <th className="pb-2 text-center">Performance Band</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {item.subjectDetails.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 font-medium text-slate-900">{sub.subjectName}</td>
                          <td className="py-2 text-right font-mono text-slate-500">{sub.maxMarks}</td>
                          <td className="py-2 text-right font-mono font-bold">{sub.displayValue}</td>
                          <td className="py-2 text-right font-mono font-bold">
                            {sub.percentage !== null ? `${sub.percentage}%` : '—'}
                          </td>
                          <td className="py-2 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-3xs font-bold border ${sub.bandColor}`}
                            >
                              {sub.bandLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-3xs text-slate-500">
            Surevin International Residential School · Permanent Academic Record
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Report</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report Card PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {isShareOpen && (
        <ShareReportModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          reportTitle={`Surevin_${student.name.replace(/\s+/g, '_')}_Academic_History.pdf`}
          className={`Class ${student.class} – ${student.section}`}
          examName={exams[0]?.name || 'Academic Progress'}
          teacherName={student.assignedTeacherName || teacher?.name || 'Assigned Faculty'}
          onDownloadPdf={() => {
            setIsShareOpen(false);
            handleDownloadReport();
          }}
        />
      )}
    </div>
  );
};
