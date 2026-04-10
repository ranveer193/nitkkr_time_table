import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DAYS, PERIODS, DEPARTMENT_COLORS } from './constants';
import { formatDateTime } from './formatters';

/**
 * Export timetable as PDF using jsPDF + autoTable
 * @param {Object} timetable - The full timetable object from the API
 */
export function exportTimetablePDF(timetable) {
  if (!timetable) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ─── Header ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 40);
  doc.text('TimeTabl', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 80);
  doc.text(timetable.title || 'Timetable', margin, 26);

  // ─── Metadata badges ───────────────────────────────────────────────────────
  let metaX = margin;
  const metaY = 33;
  const badgeH = 7;
  const badgeRadius = 1.5;

  const metaBadges = [
    { label: 'Dept:', value: timetable.department?.name || '—', color: [79, 70, 229] },
    { label: 'Building:', value: timetable.room?.building?.name || '—', color: [16, 185, 129] },
    { label: 'Room:', value: timetable.room?.name || '—', color: [245, 158, 11] },
  ];

  doc.setFontSize(8);
  metaBadges.forEach(({ label, value, color }) => {
    const text = `${label} ${value}`;
    const textWidth = doc.getTextWidth(text) + 6;
    doc.setFillColor(...color);
    doc.roundedRect(metaX, metaY - 5, textWidth, badgeH, badgeRadius, badgeRadius, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(text, metaX + 3, metaY);
    metaX += textWidth + 4;
  });

  // ─── Separator line ────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.4);
  doc.line(margin, 40, pageWidth - margin, 40);

  // ─── Build table data ──────────────────────────────────────────────────────
  const periodsCount = timetable?.periodsPerDay || PERIODS.length;
  const periods = PERIODS.slice(0, periodsCount);
  const days = (timetable?.days && timetable.days.length > 0) ? timetable.days : DAYS;

  // Collect all unique departments for color coding
  const deptMap = {};
  let deptColorIdx = 0;
  (timetable.cells || []).forEach((cell) => {
    const dName = cell.department?.name;
    if (dName && !deptMap[dName]) {
      deptMap[dName] = DEPARTMENT_COLORS[deptColorIdx % DEPARTMENT_COLORS.length];
      deptColorIdx++;
    }
  });

  // head row
  const head = [['Period / Day', ...days]];

  // body rows
  const body = periods.map((period, pIdx) => {
    const periodLabel = typeof period === 'string' ? period : period.label || `P${pIdx + 1}`;
    const row = [periodLabel];
    days.forEach((day) => {
      const cell = (timetable.cells || []).find(
        (c) => c.day === day && (c.periodIndex === pIdx || c.period === pIdx + 1)
      );
      if (cell && cell.subject) {
        const deptName = cell.department?.name || '';
        row.push(deptName ? `${cell.subject}\n[${deptName}]` : cell.subject);
      } else {
        row.push('—');
      }
    });
    return row;
  });

  // ─── autoTable ─────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 44,
    head,
    body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      valign: 'top',
      lineColor: [210, 210, 220],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: {
        fillColor: [241, 245, 249],
        fontStyle: 'bold',
        textColor: [50, 50, 70],
        cellWidth: 32,
      },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index > 0) {
        const raw = data.cell.raw || '';
        const match = raw.match(/\[(.+)\]$/);
        if (match) {
          const dName = match[1];
          const color = deptMap[dName];
          if (color) {
            const r = parseInt(color.bg.slice(1, 3), 16);
            const g = parseInt(color.bg.slice(3, 5), 16);
            const b = parseInt(color.bg.slice(5, 7), 16);
            data.cell.styles.fillColor = [r, g, b];
          }
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  // ─── Legend ────────────────────────────────────────────────────────────────
  const legendY = doc.lastAutoTable.finalY + 6;
  if (Object.keys(deptMap).length > 0 && legendY < pageHeight - 20) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 80);
    doc.text('Legend:', margin, legendY);

    let lx = margin + 16;
    Object.entries(deptMap).forEach(([name, color]) => {
      const r = parseInt(color.bg.slice(1, 3), 16);
      const g = parseInt(color.bg.slice(3, 5), 16);
      const b = parseInt(color.bg.slice(5, 7), 16);
      doc.setFillColor(r, g, b);
      doc.roundedRect(lx, legendY - 4, 3, 3.5, 0.5, 0.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 80);
      doc.text(name, lx + 4, legendY);
      lx += doc.getTextWidth(name) + 10;
    });
  }

  // ─── Footer ────────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 160);
  doc.text(
    `Generated on ${formatDateTime(new Date().toISOString())} · TimeTabl College Timetable System`,
    margin,
    pageHeight - 8
  );
  doc.text(`Page 1`, pageWidth - margin - 10, pageHeight - 8);

  // ─── Save ──────────────────────────────────────────────────────────────────
  const fileName = `${(timetable.title || 'timetable').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
