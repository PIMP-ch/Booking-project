// PDF generation using pdfmake 0.3.x — virtualfs + setFonts API

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;
let fontsSetup = false;

const fetchFont = async (url: string): Promise<ArrayBuffer> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font: ${url}`);
  return res.arrayBuffer();
};

const setupPdfMake = async () => {
  const pdfMake = (await import("pdfmake/build/pdfmake")).default;

  if (!fontCache) {
    const [regular, bold] = await Promise.all([
      fetchFont("/fonts/Sarabun-Regular.ttf"),
      fetchFont("/fonts/Sarabun-Bold.ttf"),
    ]);
    fontCache = { regular, bold };
  }

  if (!fontsSetup) {
    (pdfMake as any).virtualfs.writeFileSync("Sarabun-Regular.ttf", fontCache.regular);
    (pdfMake as any).virtualfs.writeFileSync("Sarabun-Bold.ttf", fontCache.bold);
    (pdfMake as any).setFonts({
      Sarabun: {
        normal:      "Sarabun-Regular.ttf",
        bold:        "Sarabun-Bold.ttf",
        italics:     "Sarabun-Regular.ttf",
        bolditalics: "Sarabun-Bold.ttf",
      },
    });
    fontsSetup = true;
  }

  return pdfMake;
};

const MM_TO_PT = 2.835;

const pdfStyles = {
  title:          { fontSize: 16, bold: true,  margin: [0, 0, 0, 3] as [number,number,number,number] },
  subtitle:       { fontSize: 10,              margin: [0, 0, 0, 2] as [number,number,number,number] },
  date:           { fontSize: 9,  color: "#828282" },
  sectionHeading: { fontSize: 12, bold: true,  margin: [0, 10, 0, 2] as [number,number,number,number] },
  note:           { fontSize: 9,  color: "#646464", margin: [0, 0, 0, 4] as [number,number,number,number] },
  tableHeader:    { bold: true,   fontSize: 9,  color: "white" },
  tableCell:      { fontSize: 9 },
  tableFooter:    { bold: true,   fontSize: 9 },
};

const makeTableLayout = (totalDataRows: number, footerCount = 0) => ({
  fillColor: (rowIndex: number) => {
    if (rowIndex === 0) return "#1e1e1e";
    if (footerCount > 0 && rowIndex >= 1 + totalDataRows) return "#f0f0f0";
    return rowIndex % 2 === 0 ? "#f8f8f8" : null;
  },
  hLineWidth: () => 0.3,
  vLineWidth: () => 0,
  hLineColor: () => "#e0e0e0",
});

// ─────────────────────────────────────────────────────────
// Single-table PDF
// ─────────────────────────────────────────────────────────

interface TablePdfOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  footerRows?: (string | number)[][];
  orientation?: "portrait" | "landscape";
  columnWidths?: Record<number, number>; // in mm
}

export const exportTableToPdf = async (opts: TablePdfOptions) => {
  const pdfMake = await setupPdfMake();
  const now = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

  const widths: (string | number)[] = opts.headers.map((_, i) =>
    opts.columnWidths?.[i] != null ? opts.columnWidths![i] * MM_TO_PT : "*"
  );

  const toHeaderCell = (text: string) => ({ text, style: "tableHeader", alignment: "center" });
  const toCell       = (v: string | number) => ({ text: String(v), style: "tableCell" });
  const toFooterCell = (v: string | number) => ({ text: String(v), style: "tableFooter" });

  const body = [
    opts.headers.map(toHeaderCell),
    ...opts.rows.map(row => row.map(toCell)),
    ...(opts.footerRows ?? []).map(row => row.map(toFooterCell)),
  ];

  const content: any[] = [
    { text: `ออกรายงาน: ${now}`, style: "date", alignment: "right" },
    { text: opts.title, style: "title", alignment: "center" },
    ...(opts.subtitle ? [{ text: opts.subtitle, style: "subtitle", alignment: "center" }] : []),
    { text: "", margin: [0, 4, 0, 0] },
    {
      table: { headerRows: 1, widths, body },
      layout: makeTableLayout(opts.rows.length, opts.footerRows?.length ?? 0),
    },
  ];

  pdfMake.createPdf({
    content,
    defaultStyle: { font: "Sarabun", fontSize: 9 },
    styles: pdfStyles,
    pageOrientation: opts.orientation ?? "portrait",
    pageSize: "A4",
    pageMargins: [14, 20, 14, 20],
  } as any).download(opts.filename);
};

// ─────────────────────────────────────────────────────────
// Multi-section PDF
// ─────────────────────────────────────────────────────────

export interface ReportSection {
  heading: string;
  headers: string[];
  rows: (string | number)[][];
  footerRows?: (string | number)[][];
  note?: string;
}

export const exportMultiSectionPdf = async (opts: {
  title: string;
  subtitle?: string;
  filename: string;
  sections: ReportSection[];
  orientation?: "portrait" | "landscape";
}) => {
  const pdfMake = await setupPdfMake();
  const now = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

  const toHeaderCell = (text: string) => ({ text, style: "tableHeader", alignment: "center" });
  const toCell       = (v: string | number) => ({ text: String(v), style: "tableCell" });
  const toFooterCell = (v: string | number) => ({ text: String(v), style: "tableFooter" });

  const content: any[] = [
    { text: `ออกรายงาน: ${now}`, style: "date", alignment: "right" },
    { text: opts.title, style: "title", alignment: "center" },
    ...(opts.subtitle ? [{ text: opts.subtitle, style: "subtitle", alignment: "center" }] : []),
  ];

  for (const section of opts.sections) {
    content.push({ text: section.heading, style: "sectionHeading" });
    if (section.note) content.push({ text: section.note, style: "note" });

    const body = [
      section.headers.map(toHeaderCell),
      ...section.rows.map(row => row.map(toCell)),
      ...(section.footerRows ?? []).map(row => row.map(toFooterCell)),
    ];

    content.push({
      table: {
        headerRows: 1,
        widths: section.headers.map(() => "*"),
        body,
      },
      layout: makeTableLayout(section.rows.length, section.footerRows?.length ?? 0),
      margin: [0, 0, 0, 0],
    });
  }

  pdfMake.createPdf({
    content,
    defaultStyle: { font: "Sarabun", fontSize: 9 },
    styles: pdfStyles,
    pageOrientation: opts.orientation ?? "portrait",
    pageSize: "A4",
    pageMargins: [14, 20, 14, 20],
  } as any).download(opts.filename);
};
