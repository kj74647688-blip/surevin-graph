import React, { useState } from 'react';
import {
  SpreadsheetSubject,
  SubjectGraphItem,
  SchoolSettings
} from '../../types';
import { PERFORMANCE_COLORS } from '../../utils/constants';
import { ExportService } from '../../utils/exportUtils';
import { Download, Maximize2, X, BarChart2 } from 'lucide-react';

interface SubjectGraphCardProps {
  subject: SpreadsheetSubject;
  items: SubjectGraphItem[];
  meta: {
    schoolName: string;
    examinationName: string;
    academicSession: string;
    className: string;
    sectionName: string;
    teacherName: string;
    teacherId: string;
  };
}

export const SubjectGraphCard: React.FC<SubjectGraphCardProps> = ({
  subject,
  items,
  meta,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerId = `subject-graph-${subject.id}`;

  const handleDownloadPNG = () => {
    ExportService.exportElementAsPNG(
      containerId,
      `ScoreFuture_Graph_${meta.className}_${meta.sectionName}_${subject.name.replace(/\s+/g, '_')}`
    );
  };

  return (
    <>
      <div
        id={containerId}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-slate-300 flex flex-col justify-between"
      >
        {/* Graph Card Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="text-3xs uppercase tracking-wider font-bold text-blue-700 font-mono">
                {meta.schoolName}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {subject.name}
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Max Marks: {subject.maxMarks}
                </span>
              </div>
              <div className="text-2xs font-semibold text-slate-500 mt-0.5">
                Subtitle: Student Performance · Class {meta.className} – {meta.sectionName} · {meta.examinationName} ({meta.academicSession})
              </div>
              <div className="text-3xs text-slate-400 mt-0.5">
                Teacher: {meta.teacherName} ({meta.teacherId}) · Sorted Decreasing: Highest on Left → Lowest on Right
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Download PNG for this subject"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>PNG</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreen(true)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="View Full Size"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="p-5 pt-7 pb-4">
          <div className="relative">
            {/* Horizontal Grid lines 0%, 20%, 40%, 60%, 80%, 100% */}
            <div className="absolute inset-x-0 top-0 bottom-14 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="w-full border-b border-dashed border-slate-300 flex justify-start">
                <span className="text-3xs text-slate-400 font-mono pl-1 -mt-2">100%</span>
              </div>
              <div className="w-full border-b border-dashed border-emerald-300 flex justify-start">
                <span className="text-3xs text-emerald-600 font-mono pl-1 -mt-2">80% (Green)</span>
              </div>
              <div className="w-full border-b border-dashed border-amber-300 flex justify-start">
                <span className="text-3xs text-amber-600 font-mono pl-1 -mt-2">60% (Yellow)</span>
              </div>
              <div className="w-full border-b border-dashed border-orange-300 flex justify-start">
                <span className="text-3xs text-orange-600 font-mono pl-1 -mt-2">40% (Orange)</span>
              </div>
              <div className="w-full border-b border-slate-300 flex justify-start">
                <span className="text-3xs text-slate-400 font-mono pl-1 -mt-2">0% (Red below 40%)</span>
              </div>
            </div>

            {/* Bars Container */}
            <div className="relative z-10 overflow-x-auto no-scrollbar pt-4 pb-2">
              <div className="flex items-end gap-3 h-64 min-w-[500px] px-8 border-b border-slate-300">
                {items.length === 0 ? (
                  <div className="w-full text-center py-20 text-xs text-slate-400">
                    No student marks entered for {subject.name}.
                  </div>
                ) : (
                  items.map((item, idx) => {
                    const pct = item.percentage ?? 0;
                    const heightPercent = Math.max(pct > 0 ? pct : 6, 4);
                    const colorDef = PERFORMANCE_COLORS[item.band];

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group min-w-[48px] max-w-[72px]"
                      >
                        {/* Bar Label on Top: e.g. "67/80 — 83.75%" */}
                        <div className="mb-1 text-center transition-transform group-hover:-translate-y-1">
                          {item.percentage !== null && !item.isAbsent && !item.isInvalid ? (
                            <>
                              <span className="text-2xs font-bold text-slate-900 block font-mono">
                                {item.percentage}%
                              </span>
                              <span className="text-3xs text-slate-500 font-mono block">
                                {item.marksObtained}/{item.maxMarks}
                              </span>
                            </>
                          ) : (
                            <span className="text-3xs font-bold text-slate-400 uppercase">
                              {item.bandLabel}
                            </span>
                          )}
                        </div>

                        {/* Bar Body */}
                        <div
                          className="w-full rounded-t-md transition-all duration-300 relative shadow-xs group-hover:brightness-95"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: colorDef.fillHex,
                          }}
                        >
                          {idx === 0 && item.percentage !== null && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-300 text-3xs font-bold px-1.5 py-0.2 rounded-full shadow-xs whitespace-nowrap">
                              ★ #1
                            </div>
                          )}
                        </div>

                        {/* Student Name Label Below Axis */}
                        <div className="mt-2 text-center w-full">
                          <span
                            className="text-2xs font-bold text-slate-800 block truncate group-hover:text-blue-600 transition-colors"
                            title={item.studentName}
                          >
                            {item.studentName}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-3xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Red: Below 40%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> Orange: 40%–below 60%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Yellow: 60%–80%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Green: Above 80%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Grey: Missing/Absent
            </span>
          </div>
          <span className="font-mono text-slate-400">ScoreFuture Engine v2.4</span>
        </div>
      </div>

      {/* Full-Screen Modal Preview */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {subject.name} — Full Student Performance Graph
                </h3>
                <p className="text-xs text-slate-500">
                  Class {meta.className} – {meta.sectionName} · {meta.examinationName} ({meta.academicSession})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-8">
              {/* Detailed view of all students */}
              <div className="flex items-end gap-3 h-80 px-4 border-b border-slate-300 overflow-x-auto pb-4">
                {items.map((item, idx) => {
                  const pct = item.percentage ?? 0;
                  const colorDef = PERFORMANCE_COLORS[item.band];

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end min-w-[56px]">
                      <div className="mb-1 text-center font-mono">
                        <span className="text-xs font-bold text-slate-900 block">{item.percentage !== null ? `${item.percentage}%` : '—'}</span>
                        <span className="text-3xs text-slate-400">{item.marksObtained}/{item.maxMarks}</span>
                      </div>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(pct, 4)}%`,
                          backgroundColor: colorDef.fillHex,
                        }}
                      />
                      <div className="mt-2 text-center w-full">
                        <span className="text-2xs font-bold text-slate-800 truncate block">
                          {item.studentName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
              <span>Total Assessed: {items.length} Students</span>
              <button
                type="button"
                onClick={handleDownloadPNG}
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Graph PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
