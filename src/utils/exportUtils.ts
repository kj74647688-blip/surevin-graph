import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  StudentRecord,
  Examination,
  StudentMarksRecord,
  Teacher,
  CalculatedSubjectPerformance,
  SpreadsheetSubject,
  SpreadsheetRow,
  SubjectGraphItem
} from '../types';
import {
  calculateSubjectPerformance,
  sortPerformancesDescending,
  PERFORMANCE_COLORS
} from './constants';

export const ExportService = {
  /**
   * Export 50-student Excel template matching the spreadsheet generator structure
   */
  export50StudentExcelTemplate(subjects: SpreadsheetSubject[]): void {
    const defaultSubjects = subjects.length > 0 ? subjects : [
      { id: 'sub-hindi', name: 'Hindi', maxMarks: 80 },
      { id: 'sub-eng', name: 'English', maxMarks: 80 },
      { id: 'sub-math', name: 'Maths', maxMarks: 80 },
      { id: 'sub-sci', name: 'Science', maxMarks: 80 },
    ];

    // Header row
    const headers: string[] = ['Student Name', ...defaultSubjects.map((s) => s.name)];
    // Max Marks row
    const maxMarksRow: Record<string, any> = { 'Student Name': 'Maximum Marks' };
    defaultSubjects.forEach((s) => {
      maxMarksRow[s.name] = s.maxMarks;
    });

    const rows: Record<string, any>[] = [maxMarksRow];

    // Example 3 sample students to guide the teacher
    const sampleStudents = ['Kartik', 'Ananya', 'Anjali'];
    const sampleMarks = [
      [67, 72, 65, 78],
      [60, 70, 75, 68],
      [55, 64, 71, 72]
    ];

    sampleStudents.forEach((name, idx) => {
      const row: Record<string, any> = { 'Student Name': name };
      defaultSubjects.forEach((s, sIdx) => {
        row[s.name] = sampleMarks[idx]?.[sIdx] ?? '';
      });
      rows.push(row);
    });

    // 47 empty rows (total 50 student rows)
    for (let i = 4; i <= 50; i++) {
      const row: Record<string, any> = { 'Student Name': '' };
      defaultSubjects.forEach((s) => {
        row[s.name] = '';
      });
      rows.push(row);
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    
    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 24 },
      ...defaultSubjects.map(() => ({ wch: 16 })),
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks_Template_50');

    XLSX.writeFile(workbook, 'ScoreFuture_Teacher_Marks_Template_50_Students.xlsx');
  },

  /**
   * Export marks spreadsheet as Excel (.xlsx) or CSV (.csv)
   */
  exportMarksSpreadsheet(
    subjects: SpreadsheetSubject[],
    rows: SpreadsheetRow[],
    examName: string,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): void {
    const data: Record<string, any>[] = [];

    // Row 1: Maximum Marks
    const maxRow: Record<string, any> = { 'Student Name': 'Maximum Marks' };
    subjects.forEach((s) => {
      maxRow[s.name] = s.maxMarks;
    });
    maxRow['Total Obtained'] = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    maxRow['Overall %'] = '100%';
    data.push(maxRow);

    // Student rows
    rows.forEach((r) => {
      if (!r.studentName.trim()) return;

      const rowData: Record<string, any> = {
        'Student Name': r.studentName,
      };

      let totalObt = 0;
      let totalMax = 0;
      let evaluated = 0;

      subjects.forEach((s) => {
        const val = r.marks[s.id] ?? '';
        rowData[s.name] = val;

        const num = parseFloat(val);
        if (!isNaN(num) && val.toUpperCase() !== 'A' && val.toUpperCase() !== 'ABS') {
          totalObt += num;
          totalMax += s.maxMarks;
          evaluated++;
        }
      });

      rowData['Total Obtained'] = evaluated > 0 ? totalObt : '—';
      rowData['Overall %'] = totalMax > 0 ? `${Math.round((totalObt / totalMax) * 1000) / 10}%` : '—';
      data.push(rowData);
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks_Data');

    const cleanExamName = examName.replace(/[^a-zA-Z0-9]/g, '_') || 'Examination';
    const filename = `ScoreFuture_Marks_${cleanExamName}.${format}`;
    XLSX.writeFile(workbook, filename, { bookType: format });
  },

  /**
   * Generates a combined landscape PDF with one subject graph per page!
   * Reliably draws official headers, vector bars, percentage labels, and legends.
   */
  exportCombinedSubjectGraphsPDF(
    meta: {
      schoolName: string;
      examName: string;
      academicSession: string;
      className: string;
      sectionName: string;
      teacherName: string;
      teacherId: string;
      teacherDesignation?: string;
    },
    subjects: SpreadsheetSubject[],
    subjectGraphDataMap: Record<string, SubjectGraphItem[]>
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;

    subjects.forEach((subject, subjectIdx) => {
      if (subjectIdx > 0) {
        doc.addPage('a4', 'landscape');
      }

      const items = subjectGraphDataMap[subject.id] || [];

      // 1. Blue gradient-style top bar
      doc.setFillColor(30, 58, 138); // Blue 900
      doc.rect(0, 0, pageWidth, 28, 'F');

      // School Name & Branding
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(meta.schoolName.toUpperCase(), 15, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(219, 234, 254);
      doc.text(`EXAMINATION: ${meta.examName.toUpperCase()} · SESSION: ${meta.academicSession}`, 15, 17);
      doc.text(`CLASS: ${meta.className} – ${meta.sectionName} · TEACHER: ${meta.teacherName} (${meta.teacherId})`, 15, 23);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(254, 240, 138); // Yellow accent
      doc.text(`SUBJECT: ${subject.name.toUpperCase()} (MAX MARKS: ${subject.maxMarks})`, pageWidth - 15, 17, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(219, 234, 254);
      doc.text('SUBTITLE: STUDENT PERFORMANCE', pageWidth - 15, 23, { align: 'right' });

      // 2. Chart Container Box
      const chartX = 15;
      const chartY = 36;
      const chartW = pageWidth - 30; // 267 mm
      const chartH = 138;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'FD');

      // Title inside chart card
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${subject.name} — Student Performance Graph (Sorted Decreasing Order)`, chartX + 10, chartY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total Assessed: ${items.length} Students · Highest on Left → Lowest on Right`, chartX + 10, chartY + 15);

      // Y-Axis Grid Lines for 0%, 20%, 40%, 60%, 80%, 100%
      const gridLeft = chartX + 24;
      const gridRight = chartX + chartW - 10;
      const gridBottom = chartY + chartH - 30;
      const gridHeight = 82;

      [0, 20, 40, 60, 80, 100].forEach((level) => {
        const y = gridBottom - (level / 100) * gridHeight;
        
        // Threshold color lines
        if (level === 80) doc.setDrawColor(167, 243, 208); // Green threshold
        else if (level === 60) doc.setDrawColor(254, 240, 138); // Yellow threshold
        else if (level === 40) doc.setDrawColor(254, 215, 170); // Orange threshold
        else doc.setDrawColor(241, 245, 249);

        doc.line(gridLeft, y, gridRight, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        if (level === 80) doc.setTextColor(16, 185, 129);
        else if (level === 60) doc.setTextColor(217, 119, 6);
        else if (level === 40) doc.setTextColor(234, 88, 12);
        else doc.setTextColor(148, 163, 184);

        doc.text(`${level}%`, gridLeft - 4, y + 1.2, { align: 'right' });
      });

      // Draw Bars
      const studentCount = items.length;
      const availableW = gridRight - gridLeft - 6;
      const maxBarWidth = 18;
      const barW = Math.max(4, Math.min(maxBarWidth, (availableW / (studentCount || 1)) - 3));
      const spacing = studentCount > 1 ? (availableW - barW * studentCount) / (studentCount - 1) : 10;

      items.forEach((item, idx) => {
        const barX = gridLeft + 3 + idx * (barW + spacing);
        const pct = item.percentage ?? 0;
        const barH = (pct / 100) * gridHeight;
        const barY = gridBottom - barH;

        const colorDef = PERFORMANCE_COLORS[item.band];
        const rgb = hexToRgb(colorDef.fillHex);

        if (item.percentage !== null && !item.isAbsent && !item.isInvalid) {
          doc.setFillColor(rgb.r, rgb.g, rgb.b);
          doc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, 'F');

          // Label on top of bar: e.g. "67/80 — 83.8%"
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(itemCountFontSize(studentCount));
          doc.setTextColor(30, 41, 59);

          const barLabel = `${item.marksObtained}/${item.maxMarks} (${item.percentage}%)`;
          if (studentCount <= 18) {
            doc.text(barLabel, barX + barW / 2, barY - 2, { align: 'center' });
          } else {
            // Rotated label for dense bars
            doc.text(`${item.percentage}%`, barX + barW / 2, barY - 1.5, { align: 'center' });
          }
        } else {
          // Absent or invalid grey slot
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(barX, gridBottom - 5, barW, 5, 0.8, 0.8, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(148, 163, 184);
          doc.text(item.bandLabel, barX + barW / 2, gridBottom - 7, { align: 'center' });
        }

        // Student Name Label below X-axis (Rotated 45 degrees for clean readability)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(itemCountFontSize(studentCount));
        doc.setTextColor(51, 65, 85);
        
        const shortName = item.studentName.length > 14 ? item.studentName.substring(0, 13) + '…' : item.studentName;
        doc.text(shortName, barX + barW / 2, gridBottom + 4, {
          angle: studentCount > 10 ? -35 : 0,
          align: studentCount > 10 ? 'right' : 'center',
        });
      });

      // 3. Performance Legend at Bottom of Page
      const legendY = chartY + chartH - 6;
      const legendItems = [
        { color: PERFORMANCE_COLORS.GREEN.fillHex, label: 'Green: Above 80%' },
        { color: PERFORMANCE_COLORS.YELLOW.fillHex, label: 'Yellow: 60% through 80%' },
        { color: PERFORMANCE_COLORS.ORANGE.fillHex, label: 'Orange: 40% to below 60%' },
        { color: PERFORMANCE_COLORS.RED.fillHex, label: 'Red: Below 40%' },
        { color: PERFORMANCE_COLORS.GREY.fillHex, label: 'Grey: Missing / Absent / Invalid' },
      ];

      let legX = chartX + 10;
      legendItems.forEach((leg) => {
        const rgb = hexToRgb(leg.color);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.circle(legX, legendY - 1, 1.8, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(leg.label, legX + 3.5, legendY);
        legX += 50;
      });

      // Footer
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`ScoreFuture Educational Graph System · Page ${subjectIdx + 1} of ${subjects.length}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
    });

    const cleanExam = meta.examName.replace(/[^a-zA-Z0-9]/g, '_') || 'Examination';
    const filename = `ScoreFuture_All_Subject_Graphs_${meta.className}_${meta.sectionName}_${cleanExam}.pdf`;
    doc.save(filename);
  },

  /**
   * Export Excel marks workbook for a specific class and exam
   */
  exportClassExcelWorkbook(
    students: StudentRecord[],
    marksList: StudentMarksRecord[],
    exam: Examination,
    className: string,
    sectionName: string,
    teacherName: string
  ): void {
    const dataRows = students.map((stu) => {
      const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === exam.id);
      const row: Record<string, any> = {
        'Roll No': stu.rollNumber,
        'Student Name': stu.name,
        'Class': stu.class,
        'Section': stu.section,
        'Assigned Teacher': teacherName,
      };

      let totalObtained = 0;
      let totalMax = 0;
      let evaluatedCount = 0;

      exam.subjects.forEach((sub) => {
        const entry = marksRec?.marks?.[sub.id];
        const perf = calculateSubjectPerformance(sub, entry);
        if (perf.isAbsent) {
          row[`${sub.name} (Max ${sub.maxMarks})`] = 'ABSENT';
        } else if (perf.isUnverified || perf.obtained === null) {
          row[`${sub.name} (Max ${sub.maxMarks})`] = 'UNVERIFIED';
        } else {
          row[`${sub.name} (Max ${sub.maxMarks})`] = perf.obtained;
          totalObtained += perf.obtained;
          totalMax += sub.maxMarks;
          evaluatedCount++;
        }
      });

      row['Total Obtained'] = totalObtained;
      row['Max Marks'] = totalMax;
      const overallPercent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
      row['Overall %'] = `${overallPercent}%`;

      let band = 'Critical (<40%)';
      if (overallPercent > 80) band = 'Excellent (>80%)';
      else if (overallPercent >= 60) band = 'Proficient (60-80%)';
      else if (overallPercent >= 40) band = 'Developing (40-60%)';
      row['Performance Band'] = band;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);

    // Auto-size columns
    const colWidths = Object.keys(dataRows[0] || {}).map((key) => ({
      wch: Math.max(key.length + 3, 12),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${className}-${sectionName}`);

    const filename = `ScoreFuture_Marks_${className}_${sectionName}_${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  },

  /**
   * Export a downloadable Excel / CSV template for teachers to enter marks
   */
  exportUploadTemplate(
    students: StudentRecord[],
    exam: Examination,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): void {
    const templateRows = students.map((stu) => {
      const row: Record<string, any> = {
        'Roll No': stu.rollNumber,
        'Student Name': stu.name,
        'Class': stu.class,
        'Section': stu.section,
      };

      exam.subjects.forEach((sub) => {
        row[`${sub.name} [Max ${sub.maxMarks}]`] = '';
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks_Template');

    const filename = `ScoreFuture_Bulk_Upload_Template_${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
    XLSX.writeFile(workbook, filename, { bookType: format });
  },

  /**
   * Export individual student PDF report card with official ScoreFuture graph
   */
  exportIndividualStudentPDF(
    student: StudentRecord,
    exam: Examination,
    performances: CalculatedSubjectPerformance[],
    teacher?: Teacher
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const sorted = sortPerformancesDescending(performances);

    // Header background bar
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 28, 'F');

    // Title & Institution
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SCOREFUTURE ACADEMIC ANALYTICS', 15, 12);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('OFFICIAL STUDENT PERFORMANCE PROFILE & GRAPH REPORT', 15, 18);
    doc.text(`SESSION: ${student.academicSession}`, 160, 18);

    // Student & Examination Details Card
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(15, 34, 180, 28, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(student.name, 20, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Roll Number: ${student.rollNumber}`, 20, 48);
    doc.text(`Class & Section: Class ${student.class} – ${student.section}`, 20, 54);

    doc.text(`Examination: ${exam.name}`, 105, 42);
    doc.text(`Assigned Teacher: ${student.assignedTeacherName} (${student.assignedTeacherId})`, 105, 48);
    doc.text(`Generated On: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 105, 54);

    // Section 1: Subject Marks Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('ACADEMIC PERFORMANCE SUMMARY', 15, 70);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 73, 180, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('SUBJECT', 18, 77.5);
    doc.text('CODE', 65, 77.5);
    doc.text('MAX MARKS', 95, 77.5);
    doc.text('OBTAINED', 125, 77.5);
    doc.text('PERCENTAGE', 150, 77.5);
    doc.text('BAND', 178, 77.5);

    let currentY = 85;
    let totalObt = 0;
    let totalMax = 0;

    sorted.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(item.subjectName, 18, currentY);
      doc.text(item.subjectCode, 65, currentY);
      doc.text(item.maxMarks.toString(), 95, currentY);

      if (item.isAbsent) {
        doc.setTextColor(100, 116, 139);
        doc.text('ABSENT', 125, currentY);
        doc.text('—', 150, currentY);
      } else if (item.isUnverified || item.obtained === null) {
        doc.setTextColor(100, 116, 139);
        doc.text('UNVERIFIED', 125, currentY);
        doc.text('—', 150, currentY);
      } else {
        doc.text(item.obtained.toString(), 125, currentY);
        doc.text(`${item.percentage}%`, 150, currentY);
        totalObt += item.obtained;
        totalMax += item.maxMarks;
      }

      // Performance Band Dot / Badge
      const colorDef = PERFORMANCE_COLORS[item.band];
      const rgb = hexToRgb(colorDef.fillHex);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.circle(182, currentY - 1, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(item.band, 186, currentY);

      // Light separator
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 2.5, 195, currentY + 2.5);

      currentY += 7.5;
    });

    // Total Row
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('AGGREGATE TOTAL', 18, currentY + 5);
    doc.text(totalMax.toString(), 95, currentY + 5);
    doc.text(totalObt.toString(), 125, currentY + 5);
    const overallPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 1000) / 10 : 0;
    doc.text(`${overallPct}%`, 150, currentY + 5);

    // Section 2: SCOREFUTURE GRAPH ENGINE (Visual Sorted Chart)
    const graphStartY = currentY + 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('SCOREFUTURE SUBJECT-WISE PERCENTAGE GRAPH (DECREASING ORDER)', 15, graphStartY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sorted descending: Highest percentage appears on the left, lowest on the right.', 15, graphStartY + 5);

    // Draw Chart Canvas
    const chartBoxX = 15;
    const chartBoxY = graphStartY + 8;
    const chartWidth = 180;
    const chartHeight = 70;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(chartBoxX, chartBoxY, chartWidth, chartHeight, 1, 1, 'FD');

    // Horizontal grid lines for 20%, 40%, 60%, 80%, 100%
    const gridY0 = chartBoxY + chartHeight - 14;
    const gridHeight = 46;

    [0, 20, 40, 60, 80, 100].forEach((level) => {
      const y = gridY0 - (level / 100) * gridHeight;
      doc.setDrawColor(241, 245, 249);
      doc.line(chartBoxX + 14, y, chartBoxX + chartWidth - 6, y);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${level}%`, chartBoxX + 4, y + 1);
    });

    // Draw Bars for each subject
    const barCount = sorted.length;
    const availableBarSpace = chartWidth - 25;
    const barWidth = Math.min(22, availableBarSpace / (barCount || 1) - 4);
    const spacing = (availableBarSpace - barWidth * barCount) / (barCount + 1);

    sorted.forEach((item, idx) => {
      const barX = chartBoxX + 16 + spacing + idx * (barWidth + spacing);
      const pct = item.percentage ?? 0;
      const barH = (pct / 100) * gridHeight;
      const barY = gridY0 - barH;

      const color = PERFORMANCE_COLORS[item.band];
      const rgb = hexToRgb(color.fillHex);

      // Bar fill
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      if (item.percentage !== null) {
        doc.roundedRect(barX, barY, barWidth, barH, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`${item.percentage}%`, barX + barWidth / 2, barY - 2, { align: 'center' });
      } else {
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(barX, gridY0 - 4, barWidth, 4, 1, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(item.bandLabel, barX + barWidth / 2, gridY0 - 6, { align: 'center' });
      }

      // Subject label under bar
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const shortName = item.subjectName.length > 9 ? item.subjectName.substring(0, 8) + '…' : item.subjectName;
      doc.text(shortName, barX + barWidth / 2, gridY0 + 5, { align: 'center' });
    });

    // Legend at bottom of chart
    const legendY = chartBoxY + chartHeight - 4;
    const legendItems = [
      { color: PERFORMANCE_COLORS.GREEN.fillHex, label: 'Green: > 80%' },
      { color: PERFORMANCE_COLORS.YELLOW.fillHex, label: 'Yellow: 60%–80%' },
      { color: PERFORMANCE_COLORS.ORANGE.fillHex, label: 'Orange: 40%–<60%' },
      { color: PERFORMANCE_COLORS.RED.fillHex, label: 'Red: < 40%' },
      { color: PERFORMANCE_COLORS.GREY.fillHex, label: 'Grey: Absent/Missing' },
    ];

    let legX = chartBoxX + 6;
    legendItems.forEach((leg) => {
      const rgb = hexToRgb(leg.color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.circle(legX, legendY - 1, 1.8, 'F');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text(leg.label, legX + 3.5, legendY);
      legX += 34;
    });

    // Signature Area
    const signY = 265;
    doc.setDrawColor(203, 213, 225);
    doc.line(20, signY, 70, signY);
    doc.line(135, signY, 185, signY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Assigned Teacher (${student.assignedTeacherName})`, 20, signY + 5);
    doc.text('Principal / Academic Administrator', 135, signY + 5);

    const filename = `ScoreFuture_Student_${student.rollNumber}_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
    doc.save(filename);
  },

  /**
   * Export complete class graph and performance report PDF
   */
  exportClassPDF(
    students: StudentRecord[],
    marksList: StudentMarksRecord[],
    exam: Examination,
    className: string,
    sectionName: string,
    teacher: Teacher
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Header bar
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 297, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SCOREFUTURE CLASS-WIDE ACADEMIC PERFORMANCE & GRAPH REPORT', 15, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Class: ${className} – ${sectionName}  |  Teacher: ${teacher.name} (${teacher.teacherId})  |  Examination: ${exam.name}`, 15, 19);
    doc.text(`Total Enrolled: ${students.length} Students`, 240, 19);

    // Compute Class Averages per subject
    const subjectStats = exam.subjects.map((sub) => {
      let totalPct = 0;
      let count = 0;
      let maxPct = 0;
      let minPct = 100;
      let passed = 0;

      students.forEach((stu) => {
        const marksRec = marksList.find((m) => m.studentId === stu.id && m.examId === exam.id);
        const entry = marksRec?.marks?.[sub.id];
        const perf = calculateSubjectPerformance(sub, entry);
        if (perf.percentage !== null) {
          totalPct += perf.percentage;
          count++;
          if (perf.percentage > maxPct) maxPct = perf.percentage;
          if (perf.percentage < minPct) minPct = perf.percentage;
          if (perf.percentage >= 40) passed++;
        }
      });

      return {
        subject: sub,
        avgPct: count > 0 ? Math.round((totalPct / count) * 10) / 10 : 0,
        highestPct: count > 0 ? maxPct : 0,
        lowestPct: count > 0 ? minPct : 0,
        passCount: passed,
        totalAttempted: count,
      };
    });

    const sortedStats = [...subjectStats].sort((a, b) => b.avgPct - a.avgPct);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('SUBJECT-WISE CLASS AVERAGE PERFORMANCE (DECREASING ORDER)', 15, 34);

    const boxX = 15;
    const boxY = 38;
    const boxW = 267;
    const boxH = 50;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, boxY, boxW, boxH, 1, 1, 'FD');

    const gY0 = boxY + boxH - 12;
    const gH = 30;

    [0, 20, 40, 60, 80, 100].forEach((lvl) => {
      const y = gY0 - (lvl / 100) * gH;
      doc.setDrawColor(241, 245, 249);
      doc.line(boxX + 16, y, boxX + boxW - 10, y);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${lvl}%`, boxX + 6, y + 1);
    });

    const bCount = sortedStats.length;
    const bW = 24;
    const spacing = (boxW - 35 - bW * bCount) / (bCount + 1);

    sortedStats.forEach((st, idx) => {
      const bX = boxX + 22 + spacing + idx * (bW + spacing);
      const bHeight = (st.avgPct / 100) * gH;
      const bY = gY0 - bHeight;

      let color = PERFORMANCE_COLORS.RED.fillHex;
      if (st.avgPct > 80) color = PERFORMANCE_COLORS.GREEN.fillHex;
      else if (st.avgPct >= 60) color = PERFORMANCE_COLORS.YELLOW.fillHex;
      else if (st.avgPct >= 40) color = PERFORMANCE_COLORS.ORANGE.fillHex;

      const rgb = hexToRgb(color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.roundedRect(bX, bY, bW, bHeight, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(`${st.avgPct}%`, bX + bW / 2, bY - 2, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const sName = st.subject.name.length > 12 ? st.subject.name.substring(0, 11) + '…' : st.subject.name;
      doc.text(sName, bX + bW / 2, gY0 + 5, { align: 'center' });
    });

    const filename = `ScoreFuture_Class_${className}_${sectionName}_Report.pdf`;
    doc.save(filename);
  },

  /**
   * Capture and download an element as high-resolution PNG
   */
  async exportElementAsPNG(elementId: string, filename: string): Promise<void> {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error(`Element #${elementId} not found for PNG export`);
      return;
    }

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        logging: false,
        useCORS: true,
      });

      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `${filename}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  },
};

function itemCountFontSize(count: number): number {
  if (count <= 10) return 7;
  if (count <= 20) return 6;
  if (count <= 35) return 5;
  return 4.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
