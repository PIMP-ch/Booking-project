"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import {
  reportProjectBooking, reportUserBehavior, reportEquipmentOverview,
  reportStadiumSchedule, reportEquipmentInOut, reportEquipmentDamaged,
  ReportParams,
} from "@/utils/reportGenerators";

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

interface ReportItem {
  title: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  btnColor: string;
  fn: (params: ReportParams) => Promise<void>;
  needsMonth?: boolean;
}

const EXECUTIVE_REPORTS: ReportItem[] = [
  {
    title: "รายงานการจองแบบโครงการ (เหมา)",
    description: "สรุปจำนวนโครงการ ระยะเวลาใช้สนาม และสนามที่ถูกใช้บ่อยที่สุด",
    icon: "solar:calendar-bold-duotone",
    iconBg: "bg-blue-50", iconColor: "text-blue-500", btnColor: "bg-blue-600 hover:bg-blue-700",
    fn: reportProjectBooking,
  },
  {
    title: "รายงานพฤติกรรมผู้ใช้งาน",
    description: "สถิติคณะ/หน่วยงานที่เข้าใช้บ่อย และช่วงเวลายอดนิยม",
    icon: "solar:chart-bold-duotone",
    iconBg: "bg-purple-50", iconColor: "text-purple-500", btnColor: "bg-purple-600 hover:bg-purple-700",
    fn: reportUserBehavior,
  },
  {
    title: "รายงานอุปกรณ์กีฬาในภาพรวม",
    description: "สรุปยอดคงเหลือ การเบิกใช้งาน และจำนวนที่ชำรุดเสียหาย",
    icon: "solar:devices-bold-duotone",
    iconBg: "bg-green-50", iconColor: "text-green-500", btnColor: "bg-green-600 hover:bg-green-700",
    fn: reportEquipmentOverview, needsMonth: true,
  },
];

const STAFF_REPORTS: ReportItem[] = [
  {
    title: "ตารางการใช้สนามแยกตามโครงการ",
    description: "ตารางเวลาเข้าใช้สนาม พร้อมชื่อโครงการและผู้รับผิดชอบ",
    icon: "solar:calendar-search-bold-duotone",
    iconBg: "bg-orange-50", iconColor: "text-orange-500", btnColor: "bg-orange-600 hover:bg-orange-700",
    fn: reportStadiumSchedule,
  },
  {
    title: "รายงานรับเข้า-จำหน่ายออกอุปกรณ์กีฬา",
    description: "ประวัติการเคลื่อนไหวของอุปกรณ์ทั้งหมด สำหรับตรวจสอบย้อนหลัง",
    icon: "solar:clipboard-list-bold-duotone",
    iconBg: "bg-teal-50", iconColor: "text-teal-500", btnColor: "bg-teal-600 hover:bg-teal-700",
    fn: reportEquipmentInOut, needsMonth: true,
  },
  {
    title: "รายงานอุปกรณ์เสียหาย / สูญหาย",
    description: "บัญชีอุปกรณ์ชำรุดหรือสูญหาย จำแนกตามประเภทพร้อมสาเหตุ",
    icon: "solar:danger-bold-duotone",
    iconBg: "bg-red-50", iconColor: "text-red-500", btnColor: "bg-red-600 hover:bg-red-700",
    fn: reportEquipmentDamaged, needsMonth: true,
  },
];

const ReportButton = ({
  item, year, month,
}: {
  item: ReportItem; year: number | undefined; month: number | undefined;
}) => {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await item.fn({ year, month: item.needsMonth ? month : undefined });
      toast.success(`สร้างรายงาน "${item.title}" สำเร็จ`);
    } catch {
      toast.error("สร้างรายงานไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
          <Icon icon={item.icon} className={`${item.iconColor} text-xl`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
          <p className="text-xs text-gray-400 truncate">{item.description}</p>
        </div>
      </div>
      <button
        onClick={handle}
        disabled={loading}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-medium ${item.btnColor} transition disabled:opacity-50 flex items-center gap-1.5`}
      >
        {loading
          ? <Icon icon="svg-spinners:ring-resize" className="text-sm" />
          : <Icon icon="solar:printer-minimalistic-bold" className="text-sm" />}
        {loading ? "กำลังสร้าง..." : "พิมพ์ PDF"}
      </button>
    </div>
  );
};

export default function DashboardReports() {
  const [role, setRole] = useState<string>("");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number | undefined>(undefined);

  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      setRole(user?.role || "");
    } catch {}
  }, []);

  if (!role || role === "staff") return null;

  const reports = role === "superadmin" ? EXECUTIVE_REPORTS : STAFF_REPORTS;
  const sectionTitle = role === "superadmin" ? "รายงานสำหรับผู้บริหาร" : "รายงานสำหรับเจ้าหน้าที่";
  const barColor = role === "superadmin" ? "bg-blue-600" : "bg-teal-600";

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  // label ช่วงเวลาที่เลือก
  const periodLabel = [
    `ปี ${year + 543}`,
    month ? THAI_MONTHS[month - 1] : "ทุกเดือน",
  ].join(" · ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 font-kanit">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-1 h-5 ${barColor} rounded-full`} />
        <h2 className="text-sm font-bold text-gray-700">{sectionTitle}</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100">
        <span className="text-xs text-gray-500 font-medium">ช่วงเวลารายงาน:</span>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>ปี {y + 543}</option>
          ))}
        </select>

        {/* Month */}
        <select
          value={month ?? ""}
          onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
          className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">ทุกเดือน</option>
          {THAI_MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
          {periodLabel}
        </span>
      </div>

      {/* Report list */}
      <div>
        {reports.map((item) => (
          <ReportButton key={item.title} item={item} year={year} month={month} />
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        รายงานที่มีเครื่องหมาย * จะกรองตามเดือนที่เลือก · รายงานอื่นกรองตามปีเท่านั้น
      </p>
    </div>
  );
}
