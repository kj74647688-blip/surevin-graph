import React, { useId, useState } from 'react';
import {
  StudentRecord,
  Examination,
  StudentMarksRecord,
  CalculatedSubjectPerformance
} from '../../types';
import {
  calculateSubjectPerformance,
  sortPerformancesDescending,
  PERFORMANCE_COLORS
} from '../../utils/constants';
import { ExportService } from '../../utils/exportUtils';
import { Download, FileText, Image as ImageIcon, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface StudentSubjectGraphProps {
  student: StudentRecord;
  exam: Examination;
  marksRecord?: StudentMarksRecord;
  onOpenReportModal?: () => void;
  showActions?: boolean;
}

export const StudentSubjectGraph: React.FC<StudentSubjectGraphProps> = ({
  student,
  exam,
  marksRecord,
  onOpenReportModal,
  showActions = true,
}) => {
  const chartUniqueId = useId().replace(/:/g, '');
  const containerId = `scorefuture-graph-${student.id}-${chartUniqueId}`;
  const [hoveredSubject, setHoveredSubject] = useState<CalculatedSubjectPerformance | null>(null);

  // 1. Calculate each subject performance
  const rawPerformances: CalculatedSubjectPerformance[] = exam.subjects.map((sub) => {
    const entry = marksRecord?.marks?.[sub.id];
    return calculateSubjectPerformance(sub, entry);
  });

  // 2. Sort in decreasing percentage order (highest on left, lowest on right)
  const sortedPerformances = sortPerformancesDescending(rawPerformances);

  // Calculate totals
  let totalObtained = 0;
  let totalMax = 0;
  let evaluatedSubjects = 0;

  sortedPerformances.forEach((item) => {
    if (item.obtained !== null && !item.isAbsent && !item.isUnverified) {
      totalObtained += item.obtained;
      totalMax += item.maxMarks;
      evaluatedSubjects++;
    }
  });

  const overallPercent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : null;

  const handleDownloadPNG = () => {
    ExportService.exportElementAsPNG(
      containerId,
      `ScoreFuture_Graph_${student.rollNumber}_${student.name.replace(/\s+/g, '_')}`
    );
  };

  const handleDownloadPDF = () => {
    ExportService.exportIndividualStudentPDF(student, exam, sortedPerformances);
  };

  return (
    <div
      id={containerId}
      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all hover:border-slate-300"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{student.name}</h3>
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Roll #{student.rollNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Class {student.class} – {student.section}</span>
            <span>·</span>
            <span>{exam.name}</span>
            <span>·</span>
            <span>Teacher: {student.assignedTeacherName}</span>
          </div>
        </div>

        {/* Aggregates & Action Buttons */}
        <div className="flex items-center gap-3">
          {overallPercent !== null && (
            <div className="text-right pr-2 border-r border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Overall Score</div>
              <div className="text-base font-bold text-slate-900">
                {overallPercent}%
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({totalObtained}/{totalMax})
                </span>
              </div>
            </div>
          )}

          {showActions && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadPNG}
                title="Download Graph as High-Res PNG"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">PNG</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                title="Download Individual PDF Report Card"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>PDF Report</span>
              </button>

              {onOpenReportModal && (
                <button
                  type="button"
                  onClick={onOpenReportModal}
                  title="View Full Profile Details"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Graph Description Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 my-3">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">Decreasing Percentage Order:</span>
          <span>Highest on left → Lowest on right</span>
        </div>
        <div className="text-2xs uppercase tracking-wider font-semibold text-slate-400">
          {sortedPerformances.length} Subjects Evaluated
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="relative pt-6 pb-2">
        {/* Horizontal Percentage Grid Lines */}
        <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="w-full border-b border-dashed border-slate-300 flex justify-end">
            <span className="text-3xs text-slate-400 font-mono pr-1 -mt-2">100%</span>
          </div>
          <div className="w-full border-b border-dashed border-emerald-300 flex justify-end">
            <span className="text-3xs text-emerald-600 font-mono pr-1 -mt-2">80% (Green)</span>
          </div>
          <div className="w-full border-b border-dashed border-amber-300 flex justify-end">
            <span className="text-3xs text-amber-600 font-mono pr-1 -mt-2">60% (Yellow)</span>
          </div>
          <div className="w-full border-b border-dashed border-orange-300 flex justify-end">
            <span className="text-3xs text-orange-600 font-mono pr-1 -mt-2">40% (Orange)</span>
          </div>
          <div className="w-full border-b border-slate-200 flex justify-end">
            <span className="text-3xs text-slate-400 font-mono pr-1 -mt-2">0%</span>
          </div>
        </div>

        {/* The Bars */}
        <div className="relative z-10 grid grid-flow-col auto-cols-fr gap-3 items-end h-48 px-2">
          {sortedPerformances.map((perf, idx) => {
            const pct = perf.percentage ?? 0;
            const heightPercent = Math.max(perf.percentage !== null ? pct : 6, 4);
            const colorDef = PERFORMANCE_COLORS[perf.band];
            const isHovered = hoveredSubject?.subjectId === perf.subjectId;

            return (
              <div
                key={perf.subjectId}
                className="flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredSubject(perf)}
                onMouseLeave={() => setHoveredSubject(null)}
              >
                {/* Value on Top of Bar */}
                <div className="mb-1 text-center transition-transform group-hover:-translate-y-0.5">
                  {perf.percentage !== null ? (
                    <span className="text-xs font-bold text-slate-900 block font-mono">
                      {perf.percentage}%
                    </span>
                  ) : (
                    <span className="text-2xs font-medium text-slate-400 block uppercase">
                      {perf.bandLabel}
                    </span>
                  )}
                  <span className="text-3xs text-slate-400 block font-mono">
                    {perf.obtained !== null ? `${perf.obtained}/${perf.maxMarks}` : `Max ${perf.maxMarks}`}
                  </span>
                </div>

                {/* The Bar Element */}
                <div
                  className="w-full max-w-[56px] rounded-t-md transition-all duration-300 relative shadow-xs"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: colorDef.fillHex,
                    opacity: hoveredSubject && !isHovered ? 0.6 : 1,
                    transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                >
                  {/* Rank indicator badge for #1 subject */}
                  {idx === 0 && perf.percentage !== null && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-300 text-3xs font-bold px-1.5 py-0.2 rounded-full shadow">
                      ★ #1
                    </div>
                  )}
                </div>

                {/* Subject Label Under Bar */}
                <div className="mt-2 text-center w-full">
                  <div
                    className="text-xs font-semibold text-slate-800 truncate px-0.5 group-hover:text-indigo-600 transition-colors"
                    title={perf.subjectName}
                  >
                    {perf.subjectName}
                  </div>
                  <div className="text-3xs font-mono text-slate-400">{perf.subjectCode}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Info Tooltip Banner */}
      {hoveredSubject && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 text-white text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: PERFORMANCE_COLORS[hoveredSubject.band].fillHex }}
            />
            <span className="font-bold">{hoveredSubject.subjectName}</span>
            <span className="text-slate-400">({hoveredSubject.subjectCode})</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 font-mono">
            <span>
              Marks: <strong className="text-white">{hoveredSubject.obtained ?? 'N/A'}</strong> / {hoveredSubject.maxMarks}
            </span>
            <span>
              Score: <strong className="text-white">{hoveredSubject.percentage !== null ? `${hoveredSubject.percentage}%` : 'N/A'}</strong>
            </span>
            <span>
              Status: <strong className="text-white">{hoveredSubject.bandLabel}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Exact ScoreFuture 5-Color Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-2xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="font-medium text-slate-700">Green: &gt; 80%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
            <span className="font-medium text-slate-700">Yellow: 60% – 80%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
            <span className="font-medium text-slate-700">Orange: 40% – &lt; 60%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span className="font-medium text-slate-700">Red: &lt; 40%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
            <span className="font-medium text-slate-700">Grey: Absent / Missing</span>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-3xs">
          ScoreFuture Engine v2.4
        </div>
      </div>
    </div>
  );
};
