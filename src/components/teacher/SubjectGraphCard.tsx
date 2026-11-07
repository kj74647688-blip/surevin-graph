import React, { useState } from 'react';
import {
  SpreadsheetSubject,
  SubjectGraphItem,
  SchoolSettings
} from '../../types';
import { PERFORMANCE_COLORS } from '../../utils/constants';
import { ExportService } from '../../utils/exportUtils';
import { Download, Maximize2, X, BarChart2, ChevronLeft, ChevronRight, Users, Share2 } from 'lucide-react';
import { ShareReportModal } from '../common/ShareReportModal';

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
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const STUDENTS_PER_GRAPH = 10;
  const totalPages = Math.max(1, Math.ceil(items.length / STUDENTS_PER_GRAPH));
  const safePage = Math.min(currentPage, totalPages - 1);
  const startIdx = safePage * STUDENTS_PER_GRAPH;
  const currentItems = items.slice(startIdx, startIdx + STUDENTS_PER_GRAPH);

  const containerId = `subject-graph-${subject.id}`;

  const handleDownloadPNG = () => {
    const rangeSuffix = totalPages > 1 
      ? `_Part_${safePage + 1}_Students_${startIdx + 1}_to_${startIdx + currentItems.length}` 
      : '';
    ExportService.exportElementAsPNG(
      containerId,
      `Surevin_Graph_${meta.className}_${meta.sectionName}_${subject.name.replace(/\s+/g, '_')}${rangeSuffix}`
    );
  };

  const handleDownloadPDF = () => {
    ExportService.exportSingleSubjectPDF(
      meta,
      subject,
      items
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
                Teacher: {meta.teacherName} ({meta.teacherId}) · Increasing Percentage Order: Lowest on Left → Highest on Right
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                title="Share this subject report on WhatsApp, Email, Instagram..."
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                title="Download single-subject PDF with Surevin logo in both top corners"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPNG}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Download PNG image for this subject"
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

        {/* 10-Student Batch Pagination Bar */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs text-2xs">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>10 Students Per Graph</span>
            </span>
            <span className="text-2xs text-slate-500 font-medium">
              Showing {currentItems.length > 0 ? `${startIdx + 1}–${startIdx + currentItems.length}` : '0'} of {items.length} students · Batch {safePage + 1} of {totalPages}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-bold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev 10</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setCurrentPage(pIdx)}
                    className={`w-6 h-6 text-2xs font-bold rounded-md transition-all cursor-pointer ${
                      safePage === pIdx
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pIdx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage === totalPages - 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-bold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <span>Next 10</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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

            {/* Bars Container — Max 10 Students with prominent legibility */}
            <div className="relative z-10 overflow-x-auto no-scrollbar pt-4 pb-2">
              <div className="flex items-end justify-around gap-4 h-64 min-w-[500px] px-6 border-b border-slate-300">
                {currentItems.length === 0 ? (
                  <div className="w-full text-center py-20 text-xs text-slate-400">
                    No student marks entered for {subject.name}.
                  </div>
                ) : (
                  currentItems.map((item, idx) => {
                    const pct = item.percentage ?? 0;
                    const heightPercent = Math.max(pct > 0 ? pct : 6, 4);
                    const colorDef = PERFORMANCE_COLORS[item.band];
                    const globalRank = startIdx + idx + 1;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group min-w-[56px] max-w-[84px]"
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
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 text-3xs font-bold px-1.5 py-0.2 rounded-full shadow-2xs whitespace-nowrap">
                            #{globalRank}
                          </div>
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
          <span className="font-mono text-slate-400">ScoreFuture Engine · 10 Students/Graph</span>
        </div>
      </div>

      {/* Full-Screen Modal Preview (Strictly 10 Students per View) */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {subject.name} — Student Performance Graph (Batch of 10 Students)
                </h3>
                <p className="text-xs text-slate-500">
                  Class {meta.className} – {meta.sectionName} · {meta.examinationName} ({meta.academicSession}) · Students {startIdx + 1}–{startIdx + currentItems.length} of {items.length}
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

            {/* Modal Batch Nav */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">
                  Batch {safePage + 1} of {totalPages} (Ranks #{startIdx + 1} to #{startIdx + currentItems.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                    className="px-3 py-1 font-bold text-xs bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                  >
                    « Prev 10
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={safePage === totalPages - 1}
                    className="px-3 py-1 font-bold text-xs bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                  >
                    Next 10 »
                  </button>
                </div>
              </div>
            )}

            <div className="py-8">
              {/* Detailed view of 10 students */}
              <div className="flex items-end justify-around gap-4 h-80 px-6 border-b border-slate-300 overflow-x-auto pb-4">
                {currentItems.map((item, idx) => {
                  const pct = item.percentage ?? 0;
                  const colorDef = PERFORMANCE_COLORS[item.band];
                  const globalRank = startIdx + idx + 1;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end min-w-[64px] max-w-[96px]">
                      <div className="mb-1 text-center font-mono">
                        <span className="text-xs font-bold text-slate-900 block">{item.percentage !== null ? `${item.percentage}%` : '—'}</span>
                        <span className="text-3xs text-slate-400">{item.marksObtained}/{item.maxMarks}</span>
                      </div>
                      <div
                        className="w-full rounded-t-md relative"
                        style={{
                          height: `${Math.max(pct, 4)}%`,
                          backgroundColor: colorDef.fillHex,
                        }}
                      >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-3xs font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap">
                          #{globalRank}
                        </div>
                      </div>
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
              <span>Showing 10 Students Per Graph · Total Assessed: {items.length} Students</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Download Subject PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download This 10-Student PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isShareOpen && (
        <ShareReportModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          reportTitle={`Surevin_${subject.name.replace(/\s+/g, '_')}_Graph.pdf`}
          className={`Class ${meta.className} – ${meta.sectionName}`}
          examName={meta.examinationName}
          teacherName={meta.teacherName}
          onDownloadPdf={() => {
            setIsShareOpen(false);
            handleDownloadPDF();
          }}
        />
      )}
    </>
  );
};
