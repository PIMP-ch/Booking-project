"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  reportProjectBooking,
  reportUserBehavior,
  reportEquipmentOverview,
  reportStadiumSchedule,
  reportEquipmentInOut,
  reportEquipmentDamaged,
  ReportParams,
} from "@/utils/reportGenerators";

const THAI_MONTHS_PAGE = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

interface ReportCard {
  title: string;
  description: string;
  icon: string;
  color: string;
  fn: (params: ReportParams) => Promise<void>;
  needsMonth?: boolean;
}

const EXECUTIVE_REPORTS: ReportCard[] = [
  { title: "รายงานการจองแบบโครงการ (เหมา)", description: "สรุปจำนวนโครงการทั้งหมด ระยะเวลาเข้าใช้สนาม และสนามที่ถูกใช้บ่อยที่สุด", icon: "solar:calendar-bold-duotone", color: "blue", fn: reportProjectBooking },
  { title: "รายงานพฤติกรรมผู้ใช้งาน", description: "สถิติคณะ/หน่วยงานที่เข้าใช้สนามบ่อย และช่วงเวลายอดนิยมในการจอง", icon: "solar:chart-bold-duotone", color: "purple", fn: reportUserBehavior },
  { title: "รายงานอุปกรณ์กีฬาในภาพรวม", description: "สรุปยอดคงเหลือ การเบิกใช้งาน รวมถึงจำนวนที่ชำรุดเสียหายของอุปกรณ์ทั้งหมด", icon: "solar:devices-bold-duotone", color: "green", fn: reportEquipmentOverview, needsMonth: true },
];

const STAFF_REPORTS: ReportCard[] = [
  { title: "ตารางการใช้สนามแยกตามโครงการ", description: "ตารางเวลาเข้าใช้สนามรายวัน พร้อมชื่อโครงการและผู้รับผิดชอบ", icon: "solar:calendar-search-bold-duotone", color: "orange", fn: reportStadiumSchedule },
  { title: "รายงานรับเข้า-จำหน่ายออกอุปกรณ์กีฬา", description: "ประวัติการเคลื่อนไหวของอุปกรณ์ทั้งหมด สำหรับตรวจสอบย้อนหลัง", icon: "solar:clipboard-list-bold-duotone", color: "teal", fn: reportEquipmentInOut, needsMonth: true },
  { title: "รายงานอุปกรณ์เสียหาย / สูญหาย", description: "บัญชีอุปกรณ์ชำรุดหรือสูญหาย จำแนกตามประเภทพร้อมจำนวนและสาเหตุ", icon: "solar:danger-bold-duotone", color: "red", fn: reportEquipmentDamaged, needsMonth: true },
];

const COLOR_MAP: Record<string, { bg: string; icon: string; btn: string; bar: string }> = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-500",   btn: "bg-blue-600 hover:bg-blue-700",   bar: "bg-blue-600" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500", btn: "bg-purple-600 hover:bg-purple-700", bar: "bg-purple-600" },
  green:  { bg: "bg-green-50",  icon: "text-green-500",  btn: "bg-green-600 hover:bg-green-700",  bar: "bg-green-600" },
  orange: { bg: "bg-orange-50", icon: "text-orange-500", btn: "bg-orange-600 hover:bg-orange-700", bar: "bg-orange-600" },
  teal:   { bg: "bg-teal-50",   icon: "text-teal-500",   btn: "bg-teal-600 hover:bg-teal-700",   bar: "bg-teal-600" },
  red:    { bg: "bg-red-50",    icon: "text-red-500",    btn: "bg-red-600 hover:bg-red-700",     bar: "bg-red-600" },
};

const CardItem = ({ card, year, month }: { card: ReportCard; year: number; month: number | undefined }) => {
  const [loading, setLoading] = useState(false);
  const c = COLOR_MAP[card.color];

  const handle = async () => {
    setLoading(true);
    try {
      await card.fn({ year, month: card.needsMonth ? month : undefined });
      toast.success(`สร้างรายงาน "${card.title}" สำเร็จ`);
    } catch {
      toast.error("สร้างรายงานไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon icon={card.icon} className={`${c.icon} text-2xl`} />
        </div>
        <h3 className="text-sm font-bold text-gray-800 mt-1 leading-snug">{card.title}</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{card.description}</p>
      <button
        onClick={handle}
        disabled={loading}
        className={`w-full py-2.5 rounded-lg text-white text-sm font-medium ${c.btn} transition disabled:opacity-50 flex items-center justify-center gap-2`}
      >
        {loading
          ? <><Icon icon="svg-spinners:ring-resize" className="text-base" /> กำลังสร้าง PDF...</>
          : <><Icon icon="solar:printer-minimalistic-bold" className="text-base" /> พิมพ์ / Export PDF</>}
      </button>
    </div>
  );
};

export default function ReportsPage() {
  const [role, setRole] = useState<string>("");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      setRole(user?.role || "");
    } catch {}
  }, []);

  const showExecutive = role === "superadmin";
  const showStaff = role === "admin";

  if (!showExecutive && !showStaff) {
    return <div className="p-6 font-kanit text-center text-gray-400 py-20">ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md font-kanit min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายงาน PDF</h1>
          <p className="text-sm text-gray-500 mt-1">เลือกช่วงเวลาก่อนสร้างรายงาน</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none">
            {yearOptions.map((y) => <option key={y} value={y}>ปี {y + 543}</option>)}
          </select>
          <select value={month ?? ""} onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none">
            <option value="">ทุกเดือน</option>
            {THAI_MONTHS_PAGE.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <span className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            {[`ปี ${year + 543}`, month ? THAI_MONTHS_PAGE[month - 1] : "ทุกเดือน"].join(" · ")}
          </span>
        </div>
      </div>

      {showExecutive && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-700">รายงานสำหรับผู้บริหาร</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {EXECUTIVE_REPORTS.map((c) => <CardItem key={c.title} card={c} year={year} month={month} />)}
          </div>
        </section>
      )}

      {showStaff && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-teal-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-700">รายงานสำหรับเจ้าหน้าที่</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {STAFF_REPORTS.map((c) => <CardItem key={c.title} card={c} year={year} month={month} />)}
          </div>
        </section>
      )}


    </div>
  );
}
