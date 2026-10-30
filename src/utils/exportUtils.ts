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

export const SUREVIN_ASSETS = {
  LOGO: '/assets/aistudio/surevin_babe9959.jpg',
  PHOTO: '/assets/aistudio/surevin1_c205ba01.jpg',
  SCHOOL_NAME: 'SUREVIN INTERNATIONAL RESIDENTIAL SCHOOL',
  LOCATION: 'NIWARI ROAD, MODINAGAR, DELHI-NCR',
  PROGRAM: 'ACADEMIC & SPORTS INTEGRATED RESIDENTIAL EDUCATION PROGRAM',
  AFFILIATION: 'AFFILIATED TO CBSE, NEW DELHI',
};

/**
 * Loads an image from a URL and converts it to a Base64 data URL for jsPDF.
 */
async function loadBase64Image(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
          return;
        }
      } catch (err) {
        console.warn('Canvas conversion failed for', src, err);
      }
      resolve(src);
    };
    img.onerror = () => {
      console.warn('Failed to load image from', src);
      resolve('');
    };
    img.src = src;
  });
}

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

    const headers: string[] = ['Student Name', ...defaultSubjects.map((s) => s.name)];
    const maxMarksRow: Record<string, any> = { 'Student Name': 'Maximum Marks' };
    defaultSubjects.forEach((s) => {
      maxMarksRow[s.name] = s.maxMarks;
    });

    const rows: Record<string, any>[] = [maxMarksRow];

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

    for (let i = 4; i <= 50; i++) {
      const row: Record<string, any> = { 'Student Name': '' };
      defaultSubjects.forEach((s) => {
        row[s.name] = '';
      });
      rows.push(row);
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    worksheet['!cols'] = [
      { wch: 24 },
      ...defaultSubjects.map(() => ({ wch: 16 })),
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks_Template_50');
    XLSX.writeFile(workbook, 'Surevin_Teacher_Marks_Template_50_Students.xlsx');
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

    const maxRow: Record<string, any> = { 'Student Name': 'Maximum Marks' };
    subjects.forEach((s) => {
      maxRow[s.name] = s.maxMarks;
    });
    maxRow['Total Obtained'] = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    maxRow['Overall %'] = '100%';
    data.push(maxRow);

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
    const filename = `Surevin_Marks_${cleanExamName}.${format}`;
    XLSX.writeFile(workbook, filename, { bookType: format });
  },

  /**
   * Generates combined landscape PDF with:
   * 1. PAGE 1: Official Heading / Cover Page containing the School Photo (surevin1) in center,
   *    and Surevin Logo in BOTH corners (left & right).
   * 2. PAGES 2+: Separate Subject Performance Graph per page, with Surevin Logo in BOTH corners (left & right).
   */
  async exportCombinedSubjectGraphsPDF(
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
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // Load both image assets as Base64
    const [logoBase64, schoolPhotoBase64] = await Promise.all([
      loadBase64Image(SUREVIN_ASSETS.LOGO),
      loadBase64Image(SUREVIN_ASSETS.PHOTO),
    ]);

    const STUDENTS_PER_GRAPH = 10;
    let totalGraphPages = 0;
    subjects.forEach((subject) => {
      const items = subjectGraphDataMap[subject.id] || [];
      totalGraphPages += Math.max(1, Math.ceil(items.length / STUDENTS_PER_GRAPH));
    });
    const totalPages = totalGraphPages + 1; // 1 heading page + all 10-student subject graph pages

    // =========================================================================
    // PAGE 1: OFFICIAL HEADING / COVER PAGE (WITH SCHOOL PHOTO & BOTH CORNER LOGOS)
    // =========================================================================
    // Top royal blue header bar
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, pageWidth, 35, 'F');

    // LOGO IN BOTH CORNERS (LEFT & RIGHT) OF HEADING PAGE
    const logoW = 28;
    const logoH = 28;
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', 10, 3.5, logoW, logoH);
      doc.addImage(logoBase64, 'JPEG', pageWidth - 10 - logoW, 3.5, logoW, logoH);
    }

    // Centered Heading text in Header Bar
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(SUREVIN_ASSETS.SCHOOL_NAME, pageWidth / 2, 12, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(254, 240, 138); // Yellow gold
    doc.text(SUREVIN_ASSETS.LOCATION, pageWidth / 2, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(219, 234, 254);
    doc.text(SUREVIN_ASSETS.PROGRAM, pageWidth / 2, 24, { align: 'center' });
    doc.text(`${SUREVIN_ASSETS.AFFILIATION} · SESSION: ${meta.academicSession}`, pageWidth / 2, 29.5, { align: 'center' });

    // Main Cover Title Banner
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 35, pageWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, 47, pageWidth, 47);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`EXAMINATION REPORT & SUBJECT-WISE PERFORMANCE GRAPHS — ${meta.examName.toUpperCase()}`, pageWidth / 2, 42.5, { align: 'center' });

    // Center Section: School Photo on Left, Information Card on Right
    const photoX = 16;
    const photoY = 53;
    const photoW = 132;
    const photoH = 132;

    if (schoolPhotoBase64) {
      // Draw school photo
      doc.addImage(schoolPhotoBase64, 'JPEG', photoX, photoY, photoW, photoH);
      // Outer border frame
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.8);
      doc.rect(photoX, photoY, photoW, photoH, 'D');

      // Caption under photo
      doc.setFillColor(30, 58, 138);
      doc.rect(photoX, photoY + photoH - 8, photoW, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Surevin Campus & Academic Faculty · Niwari Modinagar', photoX + photoW / 2, photoY + photoH - 2.8, { align: 'center' });
    }

    // Right Side: Institutional Examination Profile Card
    const cardX = 154;
    const cardY = 53;
    const cardW = 127;
    const cardH = 132;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'FD');

    // Card Header Bar
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(cardX, cardY, cardW, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 138);
    doc.text('OFFICIAL ACADEMIC PROFILE', cardX + 8, cardY + 7.5);

    // Profile Details Table
    const details = [
      { label: 'Examination', val: meta.examName },
      { label: 'Academic Session', val: meta.academicSession },
      { label: 'Class & Section', val: `Class ${meta.className} – ${meta.sectionName}` },
      { label: 'Assigned Teacher', val: `${meta.teacherName} (${meta.teacherId})` },
      { label: 'Teacher Designation', val: meta.teacherDesignation || 'Senior Secondary Faculty' },
      { label: 'Subjects Evaluated', val: `${subjects.length} (${subjects.map((s) => s.name).join(', ')})` },
      { label: 'Evaluation Engine', val: 'ScoreFuture Decreasing Percentage Order' },
      { label: 'Graph Resolution', val: 'One Subject Performance Graph Per Page' },
    ];

    let rowY = cardY + 20;
    details.forEach((d) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(d.label + ':', cardX + 8, rowY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const splitVal = doc.splitTextToSize(d.val, cardW - 55);
      doc.text(splitVal, cardX + 48, rowY);

      doc.setDrawColor(241, 245, 249);
      doc.line(cardX + 8, rowY + 3.5, cardX + cardW - 8, rowY + 3.5);

      rowY += Math.max(8, splitVal.length * 4.5);
    });

    // Color Performance Zone Legend inside Heading Card
    rowY += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text('PERFORMANCE COLOR ZONES:', cardX + 8, rowY);

    const zones = [
      { label: 'Green: > 80%', color: PERFORMANCE_COLORS.GREEN.fillHex },
      { label: 'Yellow: 60%–80%', color: PERFORMANCE_COLORS.YELLOW.fillHex },
      { label: 'Orange: 40%–<60%', color: PERFORMANCE_COLORS.ORANGE.fillHex },
      { label: 'Red: < 40%', color: PERFORMANCE_COLORS.RED.fillHex },
    ];

    rowY += 6;
    let zoneX = cardX + 8;
    zones.forEach((z) => {
      const rgb = hexToRgb(z.color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.circle(zoneX + 2, rowY - 1, 1.8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text(z.label, zoneX + 5, rowY);
      zoneX += 28;
    });

    // Signature Area at bottom of Card
    const signY = cardY + cardH - 14;
    doc.setDrawColor(148, 163, 184);
    doc.line(cardX + 10, signY, cardX + 50, signY);
    doc.line(cardX + cardW - 50, signY, cardX + cardW - 10, signY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Assigned Teacher Signature', cardX + 10, signY + 4);
    doc.text('Principal / Director Signature', cardX + cardW - 50, signY + 4);

    // Footer on Cover Page
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Surevin International Residential School · Niwari Modinagar · Page 1 of ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

    // =========================================================================
    // PAGES 2+: INDIVIDUAL SUBJECT GRAPHS (WITH LOGO IN BOTH CORNERS)
    // =========================================================================
    let currentPageNum = 1;

    subjects.forEach((subject) => {
      const rawItems = subjectGraphDataMap[subject.id] || [];
      const allItems = [...rawItems].sort((a, b) => {
        if (a.percentage !== null && b.percentage !== null) {
          if (a.percentage !== b.percentage) return a.percentage - b.percentage;
          return (a.studentName || '').localeCompare(b.studentName || '');
        }
        if (a.percentage !== null) return -1;
        if (b.percentage !== null) return 1;
        return (a.studentName || '').localeCompare(b.studentName || '');
      });
      const chunkCount = Math.max(1, Math.ceil(allItems.length / STUDENTS_PER_GRAPH));

      for (let chunkIdx = 0; chunkIdx < chunkCount; chunkIdx++) {
        const startIdx = chunkIdx * STUDENTS_PER_GRAPH;
        const chunkItems = allItems.slice(startIdx, startIdx + STUDENTS_PER_GRAPH);
        currentPageNum++;

        doc.addPage('a4', 'landscape');

        // Top royal blue header bar
        doc.setFillColor(30, 58, 138); // Blue 900
        doc.rect(0, 0, pageWidth, 32, 'F');

        // LOGO IN BOTH CORNERS (LEFT & RIGHT) OF EVERY SUBJECT PAGE
        const subLogoW = 26;
        const subLogoH = 26;
        if (logoBase64) {
          doc.addImage(logoBase64, 'JPEG', 8, 3, subLogoW, subLogoH);
          doc.addImage(logoBase64, 'JPEG', pageWidth - 8 - subLogoW, 3, subLogoW, subLogoH);
        }

        // Center text in Header Bar (Between both corner logos)
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(SUREVIN_ASSETS.SCHOOL_NAME, pageWidth / 2, 10, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(219, 234, 254);
        doc.text(`EXAMINATION: ${meta.examName.toUpperCase()} · SESSION: ${meta.academicSession}`, pageWidth / 2, 16, { align: 'center' });
        doc.text(`CLASS: ${meta.className} – ${meta.sectionName} · TEACHER: ${meta.teacherName} (${meta.teacherId})`, pageWidth / 2, 21.5, { align: 'center' });

        // Highlighted Subject Ribbon
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(254, 240, 138); // Yellow
        const partText = chunkCount > 1 
          ? ` — PART ${chunkIdx + 1} OF ${chunkCount} (STUDENTS ${startIdx + 1}–${startIdx + chunkItems.length})` 
          : '';
        doc.text(`SUBJECT: ${subject.name.toUpperCase()} (MAXIMUM MARKS: ${subject.maxMarks})${partText}`, pageWidth / 2, 28, { align: 'center' });

        // Chart Container Box
        const chartX = 15;
        const chartY = 38;
        const chartW = pageWidth - 30; // 267 mm
        const chartH = 156;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'FD');

        // Chart Subtitle Banner
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const rangeText = chunkCount > 1
          ? `Students ${startIdx + 1}–${startIdx + chunkItems.length} (Ranks #${startIdx + 1} to #${startIdx + chunkItems.length})`
          : `Total ${allItems.length} Students`;
        doc.text(`${subject.name} — Student Performance Graph (${rangeText})`, chartX + 12, chartY + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Max 10 Students per Graph · Total Assessed in Subject: ${allItems.length} · Increasing Percentage Order: Lowest on Left → Highest on Right`, chartX + 12, chartY + 15);

        // Y-Axis Grid Lines for 0%, 20%, 40%, 60%, 80%, 100%
        const gridLeft = chartX + 24;
        const gridRight = chartX + chartW - 12;
        const gridBottom = chartY + chartH - 32;
        const gridHeight = 98;

        [0, 20, 40, 60, 80, 100].forEach((level) => {
          const y = gridBottom - (level / 100) * gridHeight;

          if (level === 80) doc.setDrawColor(167, 243, 208);
          else if (level === 60) doc.setDrawColor(254, 240, 138);
          else if (level === 40) doc.setDrawColor(254, 215, 170);
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

        // Draw Bars (Strictly at most 10 students per page)
        const studentCount = chunkItems.length;
        const availableW = gridRight - gridLeft - 10;
        const maxBarWidth = 18;
        const barW = Math.max(8, Math.min(maxBarWidth, (availableW / (studentCount || 1)) - 4));
        const spacing = studentCount > 1 ? (availableW - barW * studentCount) / (studentCount - 1) : 20;

        chunkItems.forEach((item, idx) => {
          const barX = gridLeft + 5 + idx * (barW + spacing);
          const pct = item.percentage ?? 0;
          const barH = (pct / 100) * gridHeight;
          const barY = gridBottom - barH;

          const colorDef = PERFORMANCE_COLORS[item.band];
          const rgb = hexToRgb(colorDef.fillHex);
          const globalRank = startIdx + idx + 1;

          if (item.percentage !== null && !item.isAbsent && !item.isInvalid) {
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');

            // Rank indicator
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text(`#${globalRank}`, barX + barW / 2, barY - 6, { align: 'center' });

            // Bar Label on top: e.g. "67/80 (83.8%)"
            doc.setFontSize(7);
            doc.setTextColor(30, 41, 59);
            doc.text(`${item.marksObtained}/${item.maxMarks} (${item.percentage}%)`, barX + barW / 2, barY - 1.5, { align: 'center' });
          } else {
            // Absent or invalid slot
            doc.setFillColor(226, 232, 240);
            doc.roundedRect(barX, gridBottom - 5, barW, 5, 0.8, 0.8, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text(item.bandLabel, barX + barW / 2, gridBottom - 7, { align: 'center' });
          }

          // Student Name Label below X-axis
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);

          const shortName = item.studentName.length > 14 ? item.studentName.substring(0, 13) + '…' : item.studentName;
          doc.text(shortName, barX + barW / 2, gridBottom + 4.5, { align: 'center' });

          if (item.rollNumber) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text(`Roll: ${item.rollNumber}`, barX + barW / 2, gridBottom + 9, { align: 'center' });
          }
        });

        // Bottom Legend on each subject page
        const legendY = chartY + chartH - 7;
        const legendItems = [
          { color: PERFORMANCE_COLORS.GREEN.fillHex, label: 'Green: Above 80%' },
          { color: PERFORMANCE_COLORS.YELLOW.fillHex, label: 'Yellow: 60% through 80%' },
          { color: PERFORMANCE_COLORS.ORANGE.fillHex, label: 'Orange: 40% to below 60%' },
          { color: PERFORMANCE_COLORS.RED.fillHex, label: 'Red: Below 40%' },
          { color: PERFORMANCE_COLORS.GREY.fillHex, label: 'Grey: Missing / Absent / Invalid' },
        ];

        let legX = chartX + 12;
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
        doc.text(`Surevin International Residential School · Niwari Modinagar · Page ${currentPageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
    });

    const cleanExam = meta.examName.replace(/[^a-zA-Z0-9]/g, '_') || 'Examination';
    const filename = `Surevin_Subject_Graphs_${meta.className}_${meta.sectionName}_${cleanExam}.pdf`;
    doc.save(filename);
  },

  /**
   * Export upload template for bulk marks modal
   */
  exportUploadTemplate(
    students: StudentRecord[],
    exam: Examination,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): void {
    const data = students.map((s) => {
      const row: Record<string, any> = {
        'Roll No': s.rollNumber,
        'Student Name': s.name,
      };
      exam.subjects.forEach((sub) => {
        row[`${sub.name} (Max ${sub.maxMarks})`] = '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks_Template');
    const filename = `Surevin_Upload_Template_${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
    XLSX.writeFile(workbook, filename, { bookType: format });
  },

  /**
   * Export single subject graph PDF with Surevin logo in both top corners
   */
  async exportSingleSubjectPDF(
    meta: {
      schoolName: string;
      examName?: string;
      examinationName?: string;
      academicSession: string;
      className: string;
      sectionName: string;
      teacherName: string;
      teacherId: string;
    },
    subject: SpreadsheetSubject,
    items: SubjectGraphItem[]
  ): Promise<void> {
    const effectiveExamName = meta.examName || meta.examinationName || 'Examination';
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const logoBase64 = await loadBase64Image(SUREVIN_ASSETS.LOGO);

    const sortedItems = [...items].sort((a, b) => {
      if (a.percentage !== null && b.percentage !== null) {
        if (a.percentage !== b.percentage) return a.percentage - b.percentage;
        return (a.studentName || '').localeCompare(b.studentName || '');
      }
      if (a.percentage !== null) return -1;
      if (b.percentage !== null) return 1;
      return (a.studentName || '').localeCompare(b.studentName || '');
    });

    const STUDENTS_PER_GRAPH = 10;
    const chunkCount = Math.max(1, Math.ceil(sortedItems.length / STUDENTS_PER_GRAPH));

    for (let chunkIdx = 0; chunkIdx < chunkCount; chunkIdx++) {
      if (chunkIdx > 0) {
        doc.addPage('a4', 'landscape');
      }

      const startIdx = chunkIdx * STUDENTS_PER_GRAPH;
      const chunkItems = sortedItems.slice(startIdx, startIdx + STUDENTS_PER_GRAPH);

      // Top royal blue header bar
      doc.setFillColor(30, 58, 138); // Blue 900
      doc.rect(0, 0, pageWidth, 32, 'F');

      // LOGO IN BOTH CORNERS (LEFT & RIGHT)
      const subLogoW = 26;
      const subLogoH = 26;
      if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', 8, 3, subLogoW, subLogoH);
        doc.addImage(logoBase64, 'JPEG', pageWidth - 8 - subLogoW, 3, subLogoW, subLogoH);
      }

      // Center text in Header Bar
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(SUREVIN_ASSETS.SCHOOL_NAME, pageWidth / 2, 10, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(219, 234, 254);
      doc.text(`EXAMINATION: ${effectiveExamName.toUpperCase()} · SESSION: ${meta.academicSession}`, pageWidth / 2, 16, { align: 'center' });
      doc.text(`CLASS: ${meta.className} – ${meta.sectionName} · TEACHER: ${meta.teacherName} (${meta.teacherId})`, pageWidth / 2, 21.5, { align: 'center' });

      // Highlighted Subject Ribbon
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(254, 240, 138);
      const partText = chunkCount > 1 
        ? ` — PART ${chunkIdx + 1} OF ${chunkCount} (STUDENTS ${startIdx + 1}–${startIdx + chunkItems.length})` 
        : '';
      doc.text(`SUBJECT: ${subject.name.toUpperCase()} (MAXIMUM MARKS: ${subject.maxMarks})${partText}`, pageWidth / 2, 28, { align: 'center' });

      // Chart Container Box
      const chartX = 15;
      const chartY = 38;
      const chartW = pageWidth - 30;
      const chartH = 156;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'FD');

      // Chart Subtitle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const rangeText = chunkCount > 1
        ? `Students ${startIdx + 1}–${startIdx + chunkItems.length} (Ranks #${startIdx + 1} to #${startIdx + chunkItems.length})`
        : `Total ${items.length} Students`;
      doc.text(`${subject.name} — Student Performance Graph (${rangeText})`, chartX + 12, chartY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Max 10 Students per Graph · Total Assessed in Subject: ${items.length} · Increasing Percentage Order: Lowest on Left → Highest on Right`, chartX + 12, chartY + 15);

      // Y-Axis Grid Lines
      const gridLeft = chartX + 24;
      const gridRight = chartX + chartW - 12;
      const gridBottom = chartY + chartH - 32;
      const gridHeight = 98;

      [0, 20, 40, 60, 80, 100].forEach((level) => {
        const y = gridBottom - (level / 100) * gridHeight;
        if (level === 80) doc.setDrawColor(167, 243, 208);
        else if (level === 60) doc.setDrawColor(254, 240, 138);
        else if (level === 40) doc.setDrawColor(254, 215, 170);
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

      // Draw Bars (Strictly at most 10 students per page)
      const studentCount = chunkItems.length;
      const availableW = gridRight - gridLeft - 10;
      const maxBarWidth = 18;
      const barW = Math.max(8, Math.min(maxBarWidth, (availableW / (studentCount || 1)) - 4));
      const spacing = studentCount > 1 ? (availableW - barW * studentCount) / (studentCount - 1) : 20;

      chunkItems.forEach((item, idx) => {
        const barX = gridLeft + 5 + idx * (barW + spacing);
        const pct = item.percentage ?? 0;
        const barH = (pct / 100) * gridHeight;
        const barY = gridBottom - barH;

        const colorDef = PERFORMANCE_COLORS[item.band];
        const rgb = hexToRgb(colorDef.fillHex);
        const globalRank = startIdx + idx + 1;

        if (item.percentage !== null && !item.isAbsent && !item.isInvalid) {
          doc.setFillColor(rgb.r, rgb.g, rgb.b);
          doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');

          // Rank indicator
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`#${globalRank}`, barX + barW / 2, barY - 6, { align: 'center' });

          // Bar Label on top
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);
          doc.text(`${item.marksObtained}/${item.maxMarks} (${item.percentage}%)`, barX + barW / 2, barY - 1.5, { align: 'center' });
        } else {
          // Absent or invalid slot
          doc.setFillColor(226, 232, 240);
          doc.roundedRect(barX, gridBottom - 5, barW, 5, 0.8, 0.8, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(148, 163, 184);
          doc.text(item.bandLabel, barX + barW / 2, gridBottom - 7, { align: 'center' });
        }

        // Student Name Label below X-axis
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        const shortName = item.studentName.length > 14 ? item.studentName.substring(0, 13) + '…' : item.studentName;
        doc.text(shortName, barX + barW / 2, gridBottom + 4.5, { align: 'center' });

        if (item.rollNumber) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(148, 163, 184);
          doc.text(`Roll: ${item.rollNumber}`, barX + barW / 2, gridBottom + 9, { align: 'center' });
        }
      });

      // Bottom Legend
      const legendY = chartY + chartH - 7;
      const legendItems = [
        { color: PERFORMANCE_COLORS.GREEN.fillHex, label: 'Green: Above 80%' },
        { color: PERFORMANCE_COLORS.YELLOW.fillHex, label: 'Yellow: 60% through 80%' },
        { color: PERFORMANCE_COLORS.ORANGE.fillHex, label: 'Orange: 40% to below 60%' },
        { color: PERFORMANCE_COLORS.RED.fillHex, label: 'Red: Below 40%' },
        { color: PERFORMANCE_COLORS.GREY.fillHex, label: 'Grey: Missing / Absent / Invalid' },
      ];

      let legX = chartX + 12;
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

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Surevin International Residential School · Niwari Modinagar · Page ${chunkIdx + 1} of ${chunkCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    const cleanSubject = subject.name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanExam = effectiveExamName.replace(/[^a-zA-Z0-9]/g, '_') || 'Exam';
    doc.save(`Surevin_Graph_${meta.className}_${meta.sectionName}_${cleanSubject}_${cleanExam}.pdf`);
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

    const colWidths = Object.keys(dataRows[0] || {}).map((key) => ({
      wch: Math.max(key.length + 3, 12),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${className}-${sectionName}`);

    const filename = `Surevin_Marks_${className}_${sectionName}_${exam.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  },

  /**
   * Export individual student PDF report card with Surevin logo in both top corners
   */
  async exportIndividualStudentPDF(
    student: StudentRecord,
    exam: Examination,
    performances: CalculatedSubjectPerformance[],
    teacher?: Teacher
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const logoBase64 = await loadBase64Image(SUREVIN_ASSETS.LOGO);
    const sorted = sortPerformancesDescending(performances);

    // Header background bar
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 32, 'F');

    // LOGOS IN BOTH CORNERS OF HEADER
    const lW = 24;
    const lH = 24;
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', 6, 4, lW, lH);
      doc.addImage(logoBase64, 'JPEG', 210 - 6 - lW, 4, lW, lH);
    }

    // Title & Institution in Center
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(SUREVIN_ASSETS.SCHOOL_NAME, 105, 11, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(254, 240, 138);
    doc.text(SUREVIN_ASSETS.LOCATION, 105, 17, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(219, 234, 254);
    doc.text(`OFFICIAL STUDENT PERFORMANCE PROFILE & GRAPH REPORT · SESSION: ${student.academicSession}`, 105, 23, { align: 'center' });
    doc.text(SUREVIN_ASSETS.AFFILIATION, 105, 28, { align: 'center' });

    // Student & Examination Details Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 36, 180, 28, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(student.name, 20, 44);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Roll Number: ${student.rollNumber}`, 20, 50);
    doc.text(`Class & Section: Class ${student.class} – ${student.section}`, 20, 56);

    doc.text(`Examination: ${exam.name}`, 105, 44);
    doc.text(`Assigned Teacher: ${student.assignedTeacherName} (${student.assignedTeacherId})`, 105, 50);
    doc.text(`Generated On: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 105, 56);

    // Section 1: Subject Marks Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('ACADEMIC PERFORMANCE SUMMARY', 15, 71);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 74, 180, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('SUBJECT', 18, 78.5);
    doc.text('CODE', 65, 78.5);
    doc.text('MAX MARKS', 95, 78.5);
    doc.text('OBTAINED', 125, 78.5);
    doc.text('PERCENTAGE', 150, 78.5);
    doc.text('BAND', 178, 78.5);

    let currentY = 86;
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

      const colorDef = PERFORMANCE_COLORS[item.band];
      const rgb = hexToRgb(colorDef.fillHex);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.circle(182, currentY - 1, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(item.band, 186, currentY);

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

    // Section 2: SCOREFUTURE GRAPH ENGINE
    const graphStartY = currentY + 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('SUBJECT-WISE PERCENTAGE GRAPH (DECREASING ORDER)', 15, graphStartY);

    const chartBoxX = 15;
    const chartBoxY = graphStartY + 6;
    const chartWidth = 180;
    const chartHeight = 65;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(chartBoxX, chartBoxY, chartWidth, chartHeight, 1, 1, 'FD');

    const gridY0 = chartBoxY + chartHeight - 14;
    const gridHeight = 44;

    [0, 20, 40, 60, 80, 100].forEach((level) => {
      const y = gridY0 - (level / 100) * gridHeight;
      doc.setDrawColor(241, 245, 249);
      doc.line(chartBoxX + 14, y, chartBoxX + chartWidth - 6, y);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${level}%`, chartBoxX + 4, y + 1);
    });

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

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const shortName = item.subjectName.length > 9 ? item.subjectName.substring(0, 8) + '…' : item.subjectName;
      doc.text(shortName, barX + barWidth / 2, gridY0 + 5, { align: 'center' });
    });

    // Signature Area
    const signY = 268;
    doc.setDrawColor(203, 213, 225);
    doc.line(20, signY, 70, signY);
    doc.line(135, signY, 185, signY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Assigned Teacher (${student.assignedTeacherName})`, 20, signY + 4);
    doc.text('Principal / Academic Administrator', 135, signY + 4);

    const filename = `Surevin_Student_${student.rollNumber}_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
    doc.save(filename);
  },

  /**
   * Export complete class graph and performance report PDF with Surevin logo in both corners
   * and school photo on heading cover!
   */
  async exportClassPDF(
    students: StudentRecord[],
    marksList: StudentMarksRecord[],
    exam: Examination,
    className: string,
    sectionName: string,
    teacher: Teacher
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const [logoBase64, schoolPhotoBase64] = await Promise.all([
      loadBase64Image(SUREVIN_ASSETS.LOGO),
      loadBase64Image(SUREVIN_ASSETS.PHOTO),
    ]);

    // Top royal blue bar
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 297, 32, 'F');

    // LOGOS IN BOTH CORNERS
    const lW = 26;
    const lH = 26;
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', 8, 3, lW, lH);
      doc.addImage(logoBase64, 'JPEG', 297 - 8 - lW, 3, lW, lH);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(SUREVIN_ASSETS.SCHOOL_NAME, 297 / 2, 10, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(254, 240, 138);
    doc.text(SUREVIN_ASSETS.LOCATION, 297 / 2, 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(219, 234, 254);
    doc.text(`CLASS: ${className} – ${sectionName} · TEACHER: ${teacher.name} (${teacher.teacherId}) · EXAM: ${exam.name}`, 297 / 2, 21.5, { align: 'center' });
    doc.text(`CLASS PERFORMANCE DIGEST & SUBJECT AVERAGE REPORT · ENROLLED: ${students.length} STUDENTS`, 297 / 2, 27, { align: 'center' });

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

    // Subject Performance Graph (Class-wide averages)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('SUBJECT-WISE CLASS AVERAGE PERFORMANCE (DECREASING ORDER)', 15, 40);

    const boxX = 15;
    const boxY = 44;
    const boxW = 267;
    const boxH = 48;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, boxY, boxW, boxH, 1, 1, 'FD');

    const gY0 = boxY + boxH - 12;
    const gH = 28;

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

    // Student Roster Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('STUDENT ACADEMIC ROSTER & MARKS SUMMARY', 15, 100);

    doc.setFillColor(241, 245, 249);
    doc.rect(15, 103, 267, 6, 'F');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('ROLL', 18, 107.5);
    doc.text('STUDENT NAME', 35, 107.5);

    let subColX = 85;
    exam.subjects.forEach((s) => {
      doc.text(`${s.code} (${s.maxMarks})`, subColX, 107.5);
      subColX += 24;
    });
    doc.text('TOTAL', subColX, 107.5);
    doc.text('PCT', subColX + 16, 107.5);
    doc.text('STATUS', subColX + 30, 107.5);

    let rowY = 113;
    const previewStudents = students.slice(0, 14);

    previewStudents.forEach((stu) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(stu.rollNumber, 18, rowY);
      doc.text(stu.name, 35, rowY);

      const mRec = marksList.find((m) => m.studentId === stu.id && m.examId === exam.id);
      let sX = 85;
      let tot = 0;
      let totMax = 0;

      exam.subjects.forEach((s) => {
        const entry = mRec?.marks?.[s.id];
        const perf = calculateSubjectPerformance(s, entry);
        if (perf.isAbsent) {
          doc.setTextColor(148, 163, 184);
          doc.text('ABS', sX, rowY);
        } else if (perf.isUnverified || perf.obtained === null) {
          doc.setTextColor(148, 163, 184);
          doc.text('—', sX, rowY);
        } else {
          doc.setTextColor(30, 41, 59);
          doc.text(perf.obtained.toString(), sX, rowY);
          tot += perf.obtained;
          totMax += s.maxMarks;
        }
        sX += 24;
      });

      const pct = totMax > 0 ? Math.round((tot / totMax) * 100) : 0;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(tot.toString(), sX, rowY);
      doc.text(`${pct}%`, sX + 16, rowY);

      let band = 'Critical';
      let rgb = hexToRgb(PERFORMANCE_COLORS.RED.fillHex);
      if (pct > 80) { band = 'Above 80%'; rgb = hexToRgb(PERFORMANCE_COLORS.GREEN.fillHex); }
      else if (pct >= 60) { band = '60-80%'; rgb = hexToRgb(PERFORMANCE_COLORS.YELLOW.fillHex); }
      else if (pct >= 40) { band = '40-60%'; rgb = hexToRgb(PERFORMANCE_COLORS.ORANGE.fillHex); }

      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.circle(sX + 32, rowY - 1, 1.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(band, sX + 35, rowY);

      doc.setDrawColor(241, 245, 249);
      doc.line(15, rowY + 2, 282, rowY + 2);
      rowY += 5.5;
    });

    const filename = `Surevin_Class_${className}_${sectionName}_Report.pdf`;
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
