import React from 'react';
import {
  StudentRecord,
  Examination,
  StudentMarksRecord
} from '../../types';
import {
  calculateSubjectPerformance,
  sortPerformancesDescending,
  PERFORMANCE_COLORS
} from '../../utils/constants';
import { ExportService } from '../../utils/exportUtils';
import { StudentSubjectGraph } from '../graphs/StudentSubjectGraph';
import { ShareReportModal } from '../common/ShareReportModal';
import { X, Download, Image as ImageIcon, Printer, Award, CheckCircle2, Share2 } from 'lucide-react';

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  exam: Examination;
  marksRecord?: StudentMarksRecord;
}

export const StudentReportCardModal: React.FC<StudentReportCardModalProps> = ({
  isOpen,
  onClose,
  student,
  exam,
  marksRecord,
}) => {
  const [isShareOpen, setIsShareOpen] = React.useState(false);

  if (!isOpen) return null;

  const performances = exam.subjects.map((sub) => {
    const entry = marksRecord?.marks?.[sub.id];
    return calculateSubjectPerformance(sub, entry);
  });

  const sorted = sortPerformancesDescending(performances);

  let totalObtained = 0;
  let totalMax = 0;
  sorted.forEach((p) => {
    if (p.obtained !== null && !p.isAbsent && !p.isUnverified) {
      totalObtained += p.obtained;
      totalMax += p.maxMarks;
    }
  });

  const aggregatePercent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

  const handleDownloadPDF = () => {
    ExportService.exportIndividualStudentPDF(student, exam, sorted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-base text-white shadow-xs">
              SF
            </div>
            <div>
              <h2 className="text-base font-bold">Academic Performance Report Card</h2>
              <p className="text-xs text-slate-400">
                Official institutional analytics report · Session {student.academicSession}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Report</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-2xs uppercase font-semibold text-slate-400">Student Name</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{student.name}</div>
              <div className="text-2xs text-slate-500 font-mono">ID: {student.id.substring(0, 18)}</div>
            </div>
            <div>
              <div className="text-2xs uppercase font-semibold text-slate-400">Roll Number</div>
              <div className="text-sm font-mono font-bold text-indigo-700 mt-0.5">#{student.rollNumber}</div>
              <div className="text-2xs text-slate-500">Class {student.class} – {student.section}</div>
            </div>
            <div>
              <div className="text-2xs uppercase font-semibold text-slate-400">Examination</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{exam.name}</div>
              <div className="text-2xs text-slate-500">{exam.subjects.length} Subjects Evaluated</div>
            </div>
            <div>
              <div className="text-2xs uppercase font-semibold text-slate-400">Assigned Teacher</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{student.assignedTeacherName}</div>
              <div className="text-2xs text-slate-500 font-mono">{student.assignedTeacherId}</div>
            </div>
          </div>

          {/* Core ScoreFuture Graph */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              ScoreFuture Sorted Percentage Visual Graph
            </h3>
            <StudentSubjectGraph
              student={student}
              exam={exam}
              marksRecord={marksRecord}
              showActions={true}
            />
          </div>

          {/* Subject Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Comprehensive Subject Marks Roster
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3 text-center">Max Marks</th>
                    <th className="py-2.5 px-3 text-center">Passing</th>
                    <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                    <th className="py-2.5 px-3 text-center">Percentage</th>
                    <th className="py-2.5 px-4 text-center">Performance Band</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((item) => {
                    const colorDef = PERFORMANCE_COLORS[item.band];
                    return (
                      <tr key={item.subjectId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{item.subjectName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{item.subjectCode}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">{item.maxMarks}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">40</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {item.isAbsent ? 'Absent' : item.isUnverified || item.obtained === null ? '—' : item.obtained}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {item.percentage !== null ? `${item.percentage}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-3xs font-semibold text-white shadow-2xs"
                            style={{ backgroundColor: colorDef.fillHex }}
                          >
                            {item.bandLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t border-slate-200 font-semibold text-slate-900">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-4 uppercase text-2xs tracking-wider">Aggregate Total</td>
                    <td className="py-2.5 px-3 text-center font-mono">{totalMax}</td>
                    <td className="py-2.5 px-3 text-center font-mono">—</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">{totalObtained}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">{aggregatePercent}%</td>
                    <td className="py-2.5 px-4 text-center font-mono text-2xs text-slate-600">
                      Overall: {aggregatePercent > 80 ? 'Distinction' : aggregatePercent >= 60 ? 'First Class' : aggregatePercent >= 40 ? 'Pass' : 'Remedial Needed'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-2xs text-slate-500">
            Internal database record ID: <span className="font-mono">{student.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {isShareOpen && (
        <ShareReportModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          reportTitle={`Surevin_${student.name.replace(/\s+/g, '_')}_Report.pdf`}
          className={`Class ${student.class} – ${student.section}`}
          examName={exam.name}
          teacherName={student.assignedTeacherName}
          onDownloadPdf={() => {
            setIsShareOpen(false);
            handleDownloadPDF();
          }}
        />
      )}
    </div>
  );
};
