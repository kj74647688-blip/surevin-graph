import React, { useState } from 'react';
import {
  StudentRecord,
  Examination,
  StudentMarksRecord,
  Subject
} from '../../types';
import {
  calculateSubjectPerformance,
  PERFORMANCE_COLORS
} from '../../utils/constants';
import { ExportService } from '../../utils/exportUtils';
import { Download, Image as ImageIcon, BarChart3, TrendingUp, Users } from 'lucide-react';

interface ClassSubjectGraphProps {
  students: StudentRecord[];
  exam: Examination;
  marksList: StudentMarksRecord[];
  className: string;
  sectionName: string;
}

export const ClassSubjectGraph: React.FC<ClassSubjectGraphProps> = ({
  students,
  exam,
  marksList,
  className,
  sectionName,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const containerId = `scorefuture-class-graph-${className}-${sectionName}`;

  // Compute stats for every subject
  const subjectAnalytics = exam.subjects.map((sub) => {
    let totalPct = 0;
    let validCount = 0;
    let highestPct = 0;
    let lowestPct = 100;
    let highestStudent = '';
    let lowestStudent = '';
    let greenCount = 0;
    let yellowCount = 0;
    let orangeCount = 0;
    let redCount = 0;
    let greyCount = 0;

    students.forEach((stu) => {
      const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === exam.id);
      const entry = marksRec?.marks?.[sub.id];
      const perf = calculateSubjectPerformance(sub, entry);

      if (perf.band === 'GREEN') greenCount++;
      else if (perf.band === 'YELLOW') yellowCount++;
      else if (perf.band === 'ORANGE') orangeCount++;
      else if (perf.band === 'RED') redCount++;
      else greyCount++;

      if (perf.percentage !== null) {
        totalPct += perf.percentage;
        validCount++;
        if (perf.percentage >= highestPct) {
          highestPct = perf.percentage;
          highestStudent = stu.name;
        }
        if (perf.percentage <= lowestPct) {
          lowestPct = perf.percentage;
          lowestStudent = stu.name;
        }
      }
    });

    const avgPct = validCount > 0 ? Math.round((totalPct / validCount) * 10) / 10 : 0;
    const passRate = validCount > 0 ? Math.round(((greenCount + yellowCount + orangeCount) / validCount) * 100) : 0;

    let avgBand: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'RED';
    if (avgPct > 80) avgBand = 'GREEN';
    else if (avgPct >= 60) avgBand = 'YELLOW';
    else if (avgPct >= 40) avgBand = 'ORANGE';

    return {
      subject: sub,
      avgPct,
      highestPct: validCount > 0 ? highestPct : 0,
      lowestPct: validCount > 0 ? lowestPct : 0,
      highestStudent,
      lowestStudent,
      greenCount,
      yellowCount,
      orangeCount,
      redCount,
      greyCount,
      passRate,
      avgBand,
      totalAssessed: validCount,
    };
  });

  // Sort class subjects by average percentage in strictly decreasing order
  const sortedSubjects = [...subjectAnalytics].sort((a, b) => b.avgPct - a.avgPct);

  const handleDownloadPNG = () => {
    ExportService.exportElementAsPNG(
      containerId,
      `ScoreFuture_Class_${className}_${sectionName}_Subject_Averages`
    );
  };

  return (
    <div
      id={containerId}
      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Class-Wide Subject Performance Graphs
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Class {className} – {sectionName}</span>
            <span>·</span>
            <span>{students.length} Students Enrolled</span>
            <span>·</span>
            <span>{exam.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Graph PNG</span>
          </button>
        </div>
      </div>

      {/* Subject Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-slate-100 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedSubjectId('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
            selectedSubjectId === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Subjects Comparison
        </button>
        {exam.subjects.map((sub) => (
          <button
            key={sub.id}
            type="button"
            onClick={() => setSelectedSubjectId(sub.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
              selectedSubjectId === sub.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Main View: All Subjects Sorted Decreasing */}
      {selectedSubjectId === 'all' ? (
        <div className="pt-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <span className="font-semibold text-slate-700">
              Class Average Percentage (Sorted Decreasing — Left to Right):
            </span>
            <span className="text-3xs font-mono text-slate-400">Baseline Target: 75%</span>
          </div>

          {/* Bar Chart Grid */}
          <div className="relative pt-6 pb-2">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="w-full border-b border-dashed border-slate-300 flex justify-end">
                <span className="text-3xs text-slate-400 font-mono pr-1 -mt-2">100%</span>
              </div>
              <div className="w-full border-b border-dashed border-emerald-300 flex justify-end">
                <span className="text-3xs text-emerald-600 font-mono pr-1 -mt-2">80%</span>
              </div>
              <div className="w-full border-b border-dashed border-amber-300 flex justify-end">
                <span className="text-3xs text-amber-600 font-mono pr-1 -mt-2">60%</span>
              </div>
              <div className="w-full border-b border-dashed border-orange-300 flex justify-end">
                <span className="text-3xs text-orange-600 font-mono pr-1 -mt-2">40%</span>
              </div>
              <div className="w-full border-b border-slate-200 flex justify-end">
                <span className="text-3xs text-slate-400 font-mono pr-1 -mt-2">0%</span>
              </div>
            </div>

            {/* Bars */}
            <div className="relative z-10 grid grid-flow-col auto-cols-fr gap-4 items-end h-52 px-2">
              {sortedSubjects.map((item, idx) => {
                const colorDef = PERFORMANCE_COLORS[item.avgBand];
                return (
                  <div key={item.subject.id} className="flex flex-col items-center h-full justify-end group">
                    {/* Average percentage */}
                    <div className="mb-1 text-center">
                      <span className="text-sm font-bold text-slate-900 block font-mono">
                        {item.avgPct}%
                      </span>
                      <span className="text-3xs text-slate-400 block">
                        Pass: {item.passRate}%
                      </span>
                    </div>

                    {/* Bar */}
                    <div
                      className="w-full max-w-[64px] rounded-t-md transition-all duration-300 relative shadow-xs group-hover:brightness-95"
                      style={{
                        height: `${Math.max(item.avgPct, 6)}%`,
                        backgroundColor: colorDef.fillHex,
                      }}
                    >
                      {idx === 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-300 text-3xs font-bold px-1.5 py-0.2 rounded-full shadow">
                          Top Subject
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div className="mt-2 text-center w-full">
                      <div className="text-xs font-semibold text-slate-800 truncate px-1">
                        {item.subject.name}
                      </div>
                      <div className="text-3xs font-mono text-slate-400">
                        High: {item.highestPct}% · Low: {item.lowestPct}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Matrix Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedSubjects.map((st) => (
              <div
                key={st.subject.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{st.subject.name}</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{st.avgPct}%</span>
                </div>
                
                {/* 5-color mini distribution bar */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 mt-2">
                  <div style={{ width: `${(st.greenCount / students.length) * 100}%` }} className="bg-emerald-500" title={`>80%: ${st.greenCount}`} />
                  <div style={{ width: `${(st.yellowCount / students.length) * 100}%` }} className="bg-amber-400" title={`60-80%: ${st.yellowCount}`} />
                  <div style={{ width: `${(st.orangeCount / students.length) * 100}%` }} className="bg-orange-500" title={`40-60%: ${st.orangeCount}`} />
                  <div style={{ width: `${(st.redCount / students.length) * 100}%` }} className="bg-rose-500" title={`<40%: ${st.redCount}`} />
                  <div style={{ width: `${(st.greyCount / students.length) * 100}%` }} className="bg-slate-400" title={`Absent: ${st.greyCount}`} />
                </div>

                <div className="mt-2 text-3xs text-slate-500 flex items-center justify-between">
                  <span>Topper: <strong>{st.highestStudent}</strong> ({st.highestPct}%)</span>
                  <span>Pass: <strong>{st.passRate}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Detailed Single Subject Distribution View */
        <div className="pt-5">
          {(() => {
            const subjectData = subjectAnalytics.find((s) => s.subject.id === selectedSubjectId);
            if (!subjectData) return null;

            // Student scores sorted descending
            const studentScores = students
              .map((stu) => {
                const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === exam.id);
                const entry = marksRec?.marks?.[subjectData.subject.id];
                const perf = calculateSubjectPerformance(subjectData.subject, entry);
                return {
                  student: stu,
                  perf,
                };
              })
              .sort((a, b) => {
                if (a.perf.percentage !== null && b.perf.percentage !== null) {
                  return b.perf.percentage - a.perf.percentage;
                }
                return (b.perf.percentage ?? -1) - (a.perf.percentage ?? -1);
              });

            return (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-3xs uppercase font-semibold text-slate-400">Class Average</div>
                    <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{subjectData.avgPct}%</div>
                    <div className="text-3xs text-slate-500">Max Marks: {subjectData.subject.maxMarks}</div>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
                    <div className="text-3xs uppercase font-semibold text-emerald-700">Highest Score</div>
                    <div className="text-lg font-bold text-emerald-900 font-mono mt-0.5">{subjectData.highestPct}%</div>
                    <div className="text-3xs text-emerald-700 truncate">{subjectData.highestStudent}</div>
                  </div>
                  <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
                    <div className="text-3xs uppercase font-semibold text-rose-700">Lowest Score</div>
                    <div className="text-lg font-bold text-rose-900 font-mono mt-0.5">{subjectData.lowestPct}%</div>
                    <div className="text-3xs text-rose-700 truncate">{subjectData.lowestStudent}</div>
                  </div>
                  <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
                    <div className="text-3xs uppercase font-semibold text-indigo-700">Passing Rate</div>
                    <div className="text-lg font-bold text-indigo-900 font-mono mt-0.5">{subjectData.passRate}%</div>
                    <div className="text-3xs text-indigo-600">Passing criteria: &gt;= 40%</div>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-800 mb-2">
                  All {students.length} Students (Sorted Highest % on Left to Lowest % on Right)
                </h4>

                <div className="overflow-x-auto pb-4">
                  <div className="flex items-end gap-1.5 h-40 min-w-[700px] border-b border-slate-200 px-2">
                    {studentScores.map((item) => {
                      const pct = item.perf.percentage ?? 0;
                      const color = PERFORMANCE_COLORS[item.perf.band].fillHex;
                      return (
                        <div
                          key={item.student.id}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                          title={`${item.student.name} (Roll ${item.student.rollNumber}): ${item.perf.obtained ?? 'N/A'}/${item.perf.maxMarks} (${item.perf.percentage !== null ? item.perf.percentage + '%' : item.perf.bandLabel})`}
                        >
                          <div className="text-3xs font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">
                            {item.perf.percentage !== null ? `${item.perf.percentage}%` : 'Abs'}
                          </div>
                          <div
                            className="w-full rounded-t-xs transition-all duration-200"
                            style={{
                              height: `${Math.max(pct, 4)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-3xs text-slate-400 mt-1 px-2 font-mono">
                    <span>Topper: {studentScores[0]?.student.name} ({studentScores[0]?.perf.percentage}%)</span>
                    <span>Lowest: {studentScores[studentScores.length - 1]?.student.name} ({studentScores[studentScores.length - 1]?.perf.percentage}%)</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
