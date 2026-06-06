import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// cache font ไว้ใน memory — โหลดครั้งแรกครั้งเดียว
let fontCache: { regular: string; bold: string } | null = null;

const toBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const loadFonts = async () => {
  if (fontCache) return fontCache;
  const base = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun";
  const [regular, bold] = await Promise.all([
    toBase64(`${base}/Sarabun-Regular.ttf`),
    toBase64(`${base}/Sarabun-Bold.ttf`),
  ]);
  fontCache = { regular, bold };
  return fontCache;
};

/** สร้าง jsPDF doc ที่ embed Sarabun font แล้ว ใช้ได้ทั้งภาษาไทยและอังกฤษ */
export const createThaiPdf = async (
  orientation: "portrait" | "landscape" = "portrait"
): Promise<jsPDF> => {
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const fonts = await loadFonts();

  doc.addFileToVFS("Sarabun-Regular.ttf", fonts.regular);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.addFileToVFS("Sarabun-Bold.ttf", fonts.bold);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
  doc.setFont("Sarabun", "normal");

  return doc;
};

interface TablePdfOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  footerRows?: (string | number)[][];
  orientation?: "portrait" | "landscape";
  /** กำหนดความกว้าง column เฉพาะ เช่น { 0: 70, 1: 30 } (หน่วย mm) */
  columnWidths?: Record<number, number>;
}

/** สร้างและดาวน์โหลด PDF พร้อม header + table + footer */
export const exportTableToPdf = async (opts: TablePdfOptions) => {
  const doc = await createThaiPdf(opts.orientation);
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ─── Title ───────────────────────────────────────────────
  doc.setFont("Sarabun", "bold");
  doc.setFontSize(16);
  doc.text(opts.title, pageW / 2, 18, { align: "center" });

  if (opts.subtitle) {
    doc.setFont("Sarabun", "normal");
    doc.setFontSize(10);
    doc.text(opts.subtitle, pageW / 2, 25, { align: "center" });
  }

  doc.setFont("Sarabun", "normal");
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`ออกรายงาน: ${now}`, pageW - 14, 18, { align: "right" });
  doc.setTextColor(0, 0, 0);

  // ─── Table ───────────────────────────────────────────────
  const startY = opts.subtitle ? 30 : 25;

  const allRows = opts.footerRows
    ? [
        ...opts.rows,
        // เส้นคั่น + summary rows
        ...opts.footerRows,
      ]
    : opts.rows;

  // สร้าง columnStyles จาก columnWidths
  const columnStyles: Record<number, any> = {};
  if (opts.columnWidths) {
    Object.entries(opts.columnWidths).forEach(([col, w]) => {
      columnStyles[Number(col)] = { cellWidth: w };
    });
  }

  autoTable(doc, {
    startY,
    head: [opts.headers],
    body: allRows,
    styles: {
      font: "Sarabun",
      fontStyle: "normal",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",   // wrap ข้อความแทนการตัด
    },
    headStyles: {
      font: "Sarabun",
      fontStyle: "bold",
      fontSize: 9,
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: Object.keys(columnStyles).length > 0 ? columnStyles : undefined,
    didParseCell: (data) => {
      if (
        opts.footerRows &&
        data.section === "body" &&
        data.row.index >= opts.rows.length
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
        data.cell.styles.textColor = [30, 30, 30];
      }
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(opts.filename);
};

export interface ReportSection {
  heading: string;
  headers: string[];
  rows: (string | number)[][];
  footerRows?: (string | number)[][];
  note?: string;
}

/** PDF หลายส่วน — ใช้สำหรับรายงานที่มีหลายตาราง */
export const exportMultiSectionPdf = async (opts: {
  title: string;
  subtitle?: string;
  filename: string;
  sections: ReportSection[];
  orientation?: "portrait" | "landscape";
}) => {
  const doc = await createThaiPdf(opts.orientation);
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Title
  doc.setFont("Sarabun", "bold");
  doc.setFontSize(16);
  doc.text(opts.title, pageW / 2, 18, { align: "center" });

  if (opts.subtitle) {
    doc.setFont("Sarabun", "normal");
    doc.setFontSize(10);
    doc.text(opts.subtitle, pageW / 2, 25, { align: "center" });
  }
  doc.setFont("Sarabun", "normal");
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`ออกรายงาน: ${now}`, pageW - 14, 18, { align: "right" });
  doc.setTextColor(0, 0, 0);

  let cursorY = opts.subtitle ? 32 : 27;

  for (const section of opts.sections) {
    // Section heading
    doc.setFont("Sarabun", "bold");
    doc.setFontSize(12);
    doc.text(section.heading, 14, cursorY);
    cursorY += 2;

    if (section.note) {
      doc.setFont("Sarabun", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(section.note, 14, cursorY + 4);
      doc.setTextColor(0, 0, 0);
      cursorY += 4;
    }

    const allRows = section.footerRows
      ? [...section.rows, ...section.footerRows]
      : section.rows;

    autoTable(doc, {
      startY: cursorY + 2,
      head: [section.headers],
      body: allRows,
      styles: { font: "Sarabun", fontStyle: "normal", fontSize: 9, cellPadding: 2.5 },
      headStyles: { font: "Sarabun", fontStyle: "bold", fontSize: 9, fillColor: [30, 30, 30], textColor: [255, 255, 255], halign: "center" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      didParseCell: (data) => {
        if (section.footerRows && data.section === "body" && data.row.index >= section.rows.length) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [235, 235, 235];
        }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => { cursorY = 20; },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  doc.save(opts.filename);
};
