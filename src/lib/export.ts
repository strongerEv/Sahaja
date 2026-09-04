'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Row = Record<string, string | number>;

function stamp(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}`;
}

export function exportToPdf(opts: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  fileName: string;
}) {
  const doc = new jsPDF({ orientation: opts.columns.length > 5 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.text(opts.title, 14, 18);
  if (opts.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(opts.subtitle, 14, 25);
    doc.setTextColor(0);
  }

  autoTable(doc, {
    head: [opts.columns],
    body: opts.rows,
    startY: opts.subtitle ? 30 : 24,
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [166, 117, 63], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 246, 240] },
  });

  doc.save(`${stamp(opts.fileName)}.pdf`);
}

export function exportToExcel(opts: { sheetName: string; rows: Row[]; fileName: string }) {
  const worksheet = XLSX.utils.json_to_sheet(opts.rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, opts.sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${stamp(opts.fileName)}.xlsx`);
}

/** Parser CSV sederhana (mendukung field ber-kutip) untuk import daftar tamu. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ',' || char === ';') {
      row.push(field.trim());
      field = '';
    } else if (char === '\n') {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ''));
}

/** Baca file Excel/CSV daftar tamu -> array {name, category, phone}. */
export async function readGuestFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return raw
    .map((r) => {
      const pick = (...keys: string[]) => {
        for (const key of Object.keys(r)) {
          if (keys.includes(key.toLowerCase().trim())) return String(r[key]).trim();
        }
        return '';
      };
      return {
        name: pick('nama', 'name', 'nama tamu', 'guest'),
        category: pick('kategori', 'category', 'grup', 'group') || 'umum',
        phone: pick('telepon', 'phone', 'no hp', 'nomor', 'whatsapp', 'wa'),
      };
    })
    .filter((g) => g.name.length > 0);
}
