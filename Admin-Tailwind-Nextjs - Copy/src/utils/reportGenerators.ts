import { getAllBookings, getAllEquipment, getAllEquipmentTransactions } from "./api";
import { exportTableToPdf, exportMultiSectionPdf } from "./exportPdf";

export interface ReportParams {
  year?: number;
  month?: number; // 1-12
}

const DAMAGE_KEYWORDS = ["ชำรุด", "เสียหาย", "สูญหาย", "หาย", "พัง", "แตก", "บุบ"];
const isDamagedNote = (note: string | null) =>
  note ? DAMAGE_KEYWORDS.some((k) => note.toLowerCase().includes(k)) : false;

const isDamagedTx = (tx: any) =>
  tx.reason === "damaged" || tx.reason === "lost" || isDamagedNote(tx.note);

const REASON_LABEL: Record<string, string> = {
  normal_in:      "รับเข้าปกติ",
  normal_out:     "จำหน่ายออกปกติ",
  damaged:        "ชำรุดเสียหาย",
  lost:           "สูญหาย",
  booking_borrow: "ยืมจากการจอง",
  booking_return: "คืนจากการจอง",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });

const mkFilename = (name: string, year?: number, month?: number) => {
  const suffix = [year, month].filter(Boolean).join("-");
  return `${name}${suffix ? `_${suffix}` : ""}_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.pdf`;
};

// กรองข้อมูลตาม year/month
const filterByPeriod = (items: any[], dateField: string, year?: number, month?: number) =>
  items.filter((item) => {
    if (!year && !month) return true;
    const d = new Date(item[dateField]);
    if (year && d.getFullYear() !== year) return false;
    if (month && d.getMonth() + 1 !== month) return false;
    return true;
  });

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

// ─────────────────────────────────────────────────────────────────
// รายงานการจองแบบโครงการ (เหมา = class_schedule)
// ─────────────────────────────────────────────────────────────────
export const reportProjectBooking = async (params: ReportParams = {}) => {
  const { year, month } = params;
  const all = await getAllBookings();
  const classBookings = all.filter((b: any) => b.bookingType === "class_schedule");
  const bookings = filterByPeriod(classBookings, "startDate", year, month);

  if (bookings.length === 0) {
    alert(`ไม่พบข้อมูลการจองแบบโครงการ${year ? ` ปี ${year + 543}` : ""}`);
    return;
  }

  const stadiumCount: Record<string, number> = {};
  bookings.forEach((b: any) => {
    const s = b.Stadium?.nameStadium || "ไม่ระบุ";
    stadiumCount[s] = (stadiumCount[s] || 0) + 1;
  });
  const topStadium = Object.entries(stadiumCount).sort((a, b) => b[1] - a[1])[0];

  const projects: Record<string, { count: number; days: number; stadiums: Record<string, number>; persons: Set<string>; academicYear?: number; academicTerm?: number }> = {};
  bookings.forEach((b: any) => {
    const name = b.activityName || b.name || "ไม่ระบุโครงการ";
    if (!projects[name]) projects[name] = { count: 0, days: 0, stadiums: {}, persons: new Set(), academicYear: b.academicYear, academicTerm: b.academicTerm };
    projects[name].count++;
    const d = Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000) + 1;
    projects[name].days += d;
    const s = b.Stadium?.nameStadium || "ไม่ระบุ";
    projects[name].stadiums[s] = (projects[name].stadiums[s] || 0) + 1;
    if (b.User?.fullname) projects[name].persons.add(b.User.fullname);
  });

  const rows = Object.entries(projects).sort((a, b) => b[1].count - a[1].count).map(([name, d]) => [
    name,
    d.academicYear ? String(d.academicYear) : "-",
    d.academicTerm ? `ภาค ${d.academicTerm}` : "-",
    String(d.count),
    String(d.days),
    Object.entries(d.stadiums).sort((a, b) => b[1] - a[1]).map(([s, c]) => `${s} (${c})`).join(", "),
    [...d.persons].slice(0, 3).join(", "),
  ]);

  const periodLabel = [year ? `ปี ${year + 543}` : "", month ? THAI_MONTHS[month - 1] : ""].filter(Boolean).join(" ");

  await exportTableToPdf({
    title: "รายงานการจองแบบโครงการ (เหมา/ล็อคเวลาเรียน)",
    subtitle: [
      `สนามที่ใช้บ่อยที่สุด: ${topStadium ? `${topStadium[0]} (${topStadium[1]} ครั้ง)` : "-"}`,
      `รวม ${Object.keys(projects).length} โครงการ`,
      periodLabel,
    ].filter(Boolean).join("  |  "),
    filename: mkFilename("รายงานโครงการเหมา", year, month),
    headers: ["ชื่อโครงการ / กิจกรรม", "ปีการศึกษา", "ภาคเรียน", "ครั้งที่จอง", "รวมวัน", "สนามที่ใช้", "ผู้รับผิดชอบ"],
    rows,
    footerRows: [["รวมทั้งหมด", "", "", String(bookings.length), String(rows.reduce((s, r) => s + Number(r[4]), 0)), "", ""]],
    orientation: "landscape",
  });
};

// ─────────────────────────────────────────────────────────────────
// รายงานพฤติกรรมผู้ใช้งาน
// ─────────────────────────────────────────────────────────────────
export const reportUserBehavior = async (params: ReportParams = {}) => {
  const { year, month } = params;
  const all = await getAllBookings();
  const filtered = filterByPeriod(
    all.filter((b: any) => b.status?.toLowerCase() !== "canceled"),
    "startDate", year, month
  );

  const deptCount: Record<string, number> = {};
  filtered.forEach((b: any) => {
    const u = b.User;
    const dept = u?.userType === "staff"
      ? (u?.department || "บุคลากร (ไม่ระบุหน่วยงาน)")
      : (u?.fieldOfStudy || "นักศึกษา (ไม่ระบุสาขา)");
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  });
  const deptRows = Object.entries(deptCount).sort((a, b) => b[1] - a[1]).map(([dept, count], i) => [String(i + 1), dept, String(count)]);

  const slots: Record<string, number> = {
    "เช้า (06:00 – 12:00)": 0, "กลางวัน (12:00 – 16:00)": 0,
    "เย็น (16:00 – 20:00)": 0, "กลางคืน (20:00 – 24:00)": 0,
  };
  filtered.forEach((b: any) => {
    const h = parseInt((b.startTime || "0").split(":")[0], 10);
    if (h >= 6 && h < 12) slots["เช้า (06:00 – 12:00)"]++;
    else if (h >= 12 && h < 16) slots["กลางวัน (12:00 – 16:00)"]++;
    else if (h >= 16 && h < 20) slots["เย็น (16:00 – 20:00)"]++;
    else slots["กลางคืน (20:00 – 24:00)"]++;
  });
  const slotRows = Object.entries(slots).sort((a, b) => b[1] - a[1]).map(([slot, count]) => [slot, String(count), filtered.length ? `${((count / filtered.length) * 100).toFixed(1)}%` : "0%"]);

  const periodLabel = [year ? `ปี ${year + 543}` : "", month ? THAI_MONTHS[month - 1] : ""].filter(Boolean).join(" ");

  await exportMultiSectionPdf({
    title: "รายงานพฤติกรรมผู้ใช้งาน",
    subtitle: [`จำนวนการจองทั้งหมด: ${filtered.length} รายการ`, periodLabel].filter(Boolean).join("  |  "),
    filename: mkFilename("รายงานพฤติกรรมผู้ใช้", year, month),
    orientation: "portrait",
    sections: [
      { heading: "สถิติคณะ / หน่วยงานที่เข้าใช้สนามบ่อย", headers: ["อันดับ", "คณะ / หน่วยงาน / สาขา", "จำนวนการจอง (ครั้ง)"], rows: deptRows },
      { heading: "ช่วงเวลายอดนิยมในการจองสนาม", headers: ["ช่วงเวลา", "จำนวนการจอง (ครั้ง)", "สัดส่วน (%)"], rows: slotRows },
    ],
  });
};

// ─────────────────────────────────────────────────────────────────
// รายงานอุปกรณ์กีฬาในภาพรวม
// ─────────────────────────────────────────────────────────────────
export const reportEquipmentOverview = async (params: ReportParams = {}) => {
  const { year, month } = params;
  const [equipList, txData] = await Promise.all([getAllEquipment(), getAllEquipmentTransactions()]);
  const txAll: any[] = Array.isArray(txData) ? txData : (txData?.transactions ?? []);
  const txList = filterByPeriod(txAll, "createdAt", year, month);

  const txByEquip: Record<string, { in: number; out: number; damaged: number }> = {};
  txList.forEach((tx: any) => {
    const id = String(tx.equipmentId);
    if (!txByEquip[id]) txByEquip[id] = { in: 0, out: 0, damaged: 0 };
    if (tx.type === "in") txByEquip[id].in += tx.quantity;
    if (tx.type === "out") {
      txByEquip[id].out += tx.quantity;
      if (isDamagedTx(tx)) txByEquip[id].damaged += tx.quantity;
    }
  });

  const rows = equipList.map((eq: any) => {
    const t = txByEquip[String(eq.id)] ?? { in: 0, out: 0, damaged: 0 };
    return [eq.name || `ID: ${eq.id}`, String(t.in), String(t.out), String(eq.quantity), String(t.damaged)];
  });

  const totalIn = rows.reduce((s, r) => s + Number(r[1]), 0);
  const totalOut = rows.reduce((s, r) => s + Number(r[2]), 0);
  const totalQty = rows.reduce((s, r) => s + Number(r[3]), 0);
  const totalDamaged = rows.reduce((s, r) => s + Number(r[4]), 0);

  const periodLabel = [year ? `ปี ${year + 543}` : "", month ? THAI_MONTHS[month - 1] : ""].filter(Boolean).join(" ");

  await exportTableToPdf({
    title: "รายงานอุปกรณ์กีฬาในภาพรวม",
    subtitle: [`อุปกรณ์ทั้งหมด: ${equipList.length} รายการ  |  รวมชำรุด/สูญหาย: ${totalDamaged} ชิ้น`, periodLabel].filter(Boolean).join("  |  "),
    filename: mkFilename("รายงานอุปกรณ์ภาพรวม", year, month),
    headers: ["ชื่ออุปกรณ์", "รับเข้า (ชิ้น)", "จำหน่ายออก (ชิ้น)", "คงเหลือ (ชิ้น)", "ชำรุด/สูญหาย (ชิ้น)"],
    rows,
    footerRows: [["รวมทั้งหมด", String(totalIn), String(totalOut), String(totalQty), String(totalDamaged)]],
    orientation: "landscape",
    columnWidths: { 0: 80 },  // ชื่ออุปกรณ์กว้างกว่า
  });
};

// ─────────────────────────────────────────────────────────────────
// ตารางการใช้สนามแยกตามโครงการ — จัดกลุ่มตามสนาม
// ─────────────────────────────────────────────────────────────────
export const reportStadiumSchedule = async (params: ReportParams = {}) => {
  const { year, month } = params;
  const all = await getAllBookings();
  const bookings = filterByPeriod(
    all.filter((b: any) => ["confirmed", "pending", "Return Success"].includes(b.status?.toLowerCase() ?? "")),
    "startDate", year, month
  ).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  if (bookings.length === 0) {
    const pLabel = [year ? `ปี ${year + 543}` : "", month ? THAI_MONTHS[month - 1] : ""].filter(Boolean).join(" ");
    alert(`ไม่พบข้อมูลการจองสนาม${pLabel ? ` (${pLabel})` : ""}`);
    return;
  }

  // จัดกลุ่มตามชื่อสนาม
  const byStadium: Record<string, any[]> = {};
  bookings.forEach((b: any) => {
    const s = b.Stadium?.nameStadium || "ไม่ระบุสนาม";
    if (!byStadium[s]) byStadium[s] = [];
    byStadium[s].push(b);
  });

  const periodLabel = [year ? `ปี ${year + 543}` : "", month ? THAI_MONTHS[month - 1] : ""].filter(Boolean).join(" ");

  const sections = Object.entries(byStadium).map(([stadium, bList]) => ({
    heading: `สนาม: ${stadium}  (${bList.length} รายการ)`,
    headers: ["#", "วันที่จอง", "วันที่เข้าใช้งาน", "เวลา", "โครงการ / กิจกรรม", "ผู้รับผิดชอบ", "เบอร์โทร", "อาคาร", "สถานะ"],
    rows: bList.map((b: any, i: number) => {
      const statusMap: Record<string, string> = {
        confirmed: "ยืนยันแล้ว", pending: "รอยืนยัน",
        canceled: "ยกเลิก", "Return Success": "เสร็จสิ้น",
      };
      return [
        String(i + 1),
        fmtDate(b.createdAt || b.startDate),
        `${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}`,
        `${b.startTime} – ${b.endTime}`,
        b.activityName || b.name || "-",
        b.User?.fullname || "-",
        b.User?.phoneNumber || "-",
        b.Buildings?.map((bd: any) => bd.name).join(", ") || "-",
        statusMap[b.status?.toLowerCase()] || b.status || "-",
      ];
    }),
  }));

  await exportMultiSectionPdf({
    title: "ตารางการใช้สนามแยกตามโครงการ",
    subtitle: [`สนามทั้งหมด: ${Object.keys(byStadium).length} สนาม  |  รวม ${bookings.length} รายการ`, periodLabel].filter(Boolean).join("  |  "),
    filename: mkFilename("ตารางการใช้สนาม", year, month),
    orientation: "landscape",
    sections,
  });
};

// ─────────────────────────────────────────────────────────────────
// รายงานรับเข้า-จำหน่ายออกอุปกรณ์กีฬา
// ─────────────────────────────────────────────────────────────────
export const reportEquipmentInOut = async (params: ReportParams = {}) => {
  const { year, month } = params;
  const txData = await getAllEquipmentTransactions();
  const txAll: any[] = Array.isArray(txData) ? txData : (txData?.transactions ?? []);
  const txList = filterByPeriod(txAll, "createdAt", year, month);

  const getEquipName = (tx: any): string =>
    (tx.equipmentName as string) || `ID: ${tx.equipmentId}`;

  const rows = [...txList]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((tx: any, i: number) => [
      String(i + 1),
      getEquipName(tx),
      tx.type === "in" ? "รับเข้า" : "จำหน่ายออก",
      REASON_LABEL[tx.reason] || (tx.type === "in" ? "รับเข้าปกติ" : "จำหน่ายออกปกติ"),
      String(tx.quantity),
      tx.note || "-",
      fmtDate(tx.createdAt),
    ]);

  const totalIn  = txList.filter((t: any) => t.type === "in").reduce((s: number, t: any) => s + t.quantity, 0);
  const totalOut = txList.filter((t: any) => t.type === "out").reduce((s: number, t: any) => s + t.quantity, 0);

  const periodLabel = [year ? `ปี ${year + 543}` : "", month ? THAI_MONTHS[month - 1] : ""].filter(Boolean).join(" ");

  await exportTableToPdf({
    title: "รายงานรับเข้า-จำหน่ายออกอุปกรณ์กีฬา",
    subtitle: [`รายการทั้งหมด: ${txList.length} รายการ`, periodLabel].filter(Boolean).join("  |  "),
    filename: mkFilename("รายงานรับเข้าจำหน่ายออก", year, month),
    headers: ["#", "ชื่ออุปกรณ์", "ประเภท", "เหตุผล", "จำนวน (ชิ้น)", "หมายเหตุ", "วันที่"],
    rows,
    footerRows: [
      ["", "รวมรับเข้าทั้งหมด", "", "", String(totalIn), "", ""],
      ["", "รวมจำหน่ายออกทั้งหมด", "", "", String(totalOut), "", ""],
    ],
    orientation: "landscape",
    columnWidths: { 1: 70, 3: 55, 5: 60 },
  });
};

// ─────────────────────────────────────────────────────────────────
// รายงานอุปกรณ์เสียหาย / สูญหาย
// ─────────────────────────────────────────────────────────────────
export const reportEquipmentDamaged = async (params: ReportParams = {}) => {
  const { year, month } = params;
  const txData = await getAllEquipmentTransactions();
  const txAll: any[] = Array.isArray(txData) ? txData : (txData?.transactions ?? []);
  const filtered = filterByPeriod(txAll, "createdAt", year, month);
  const damaged = filtered.filter((tx: any) => tx.type === "out" && isDamagedTx(tx));

  if (damaged.length === 0) {
    const pLabel = [year ? `ปี ${year + 543}` : "", month ? THAI_MONTHS[month - 1] : ""].filter(Boolean).join(" ");
    alert(`ไม่พบรายการอุปกรณ์ชำรุด/สูญหาย${pLabel ? ` (${pLabel})` : ""}`);
    return;
  }

  const getName = (tx: any): string =>
    (tx.equipmentName as string) || `ID: ${tx.equipmentId}`;

  const byEquip: Record<string, { total: number; count: number }> = {};
  damaged.forEach((tx: any) => {
    const name = getName(tx);
    if (!byEquip[name]) byEquip[name] = { total: 0, count: 0 };
    byEquip[name].total += tx.quantity;
    byEquip[name].count++;
  });

  const summaryRows = Object.entries(byEquip).sort((a, b) => b[1].total - a[1].total).map(([name, d]) => [name, String(d.total), String(d.count)]);

  const detailRows = [...damaged]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((tx: any, i: number) => [
      String(i + 1),
      getName(tx),
      REASON_LABEL[tx.reason] || (isDamagedNote(tx.note) ? "ชำรุดเสียหาย" : "จำหน่ายออกปกติ"),
      String(tx.quantity),
      tx.note || "-",
      fmtDate(tx.createdAt),
    ]);

  const totalQty = damaged.reduce((s: number, tx: any) => s + tx.quantity, 0);
  const periodLabel = [year ? `ปี ${year + 543}` : "", month ? THAI_MONTHS[month - 1] : ""].filter(Boolean).join(" ");

  await exportMultiSectionPdf({
    title: "รายงานอุปกรณ์เสียหาย / สูญหาย",
    subtitle: [`รวม ${damaged.length} รายการ  |  รวมจำนวน: ${totalQty} ชิ้น`, periodLabel].filter(Boolean).join("  |  "),
    filename: mkFilename("รายงานอุปกรณ์เสียหาย", year, month),
    orientation: "landscape",
    sections: [
      {
        heading: "สรุปตามประเภทอุปกรณ์",
        headers: ["ชื่ออุปกรณ์", "จำนวนรวม (ชิ้น)", "จำนวนรายการ"],
        rows: summaryRows,
        note: `* รวมรายการที่บันทึกเหตุผล "ชำรุดเสียหาย" หรือ "สูญหาย" และหมายเหตุที่มีคำว่า: ${DAMAGE_KEYWORDS.join(", ")}`,
      },
      {
        heading: "รายละเอียดรายการ",
        headers: ["#", "ชื่ออุปกรณ์", "ประเภท", "จำนวน (ชิ้น)", "หมายเหตุ", "วันที่"],
        rows: detailRows,
        footerRows: [["", "รวมทั้งหมด", "", String(totalQty), "", ""]],
      },
    ],
  });
};
