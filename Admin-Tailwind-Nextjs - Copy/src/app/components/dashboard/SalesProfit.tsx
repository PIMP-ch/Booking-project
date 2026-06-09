"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Select } from "flowbite-react";
import {
  getBookingStatsByBuilding,
  getMonthlyBookingStats,
  getDailyBookingStats,
  getBookingsByDate,
} from "@/utils/api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const monthNameToIndex = (name: string) => THAI_MONTHS.indexOf(name);
const getCurrentThaiMonth = () => THAI_MONTHS[new Date().getMonth()];

const BUILDING_COLORS = [
  "#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#6366F1","#84CC16",
];

interface StatPoint {
  period: number;
  building: string;
  count: number;
}

interface DayBooking {
  id: string;
  activityName: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  status: string;
  Stadium: { nameStadium: string } | null;
  Buildings: { name: string }[];
  User: { fullname: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "รอยืนยัน", confirmed: "ยืนยันแล้ว",
  canceled: "ยกเลิก", "Return Success": "คืนเรียบร้อย",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  canceled: "bg-red-100 text-red-600",
  "Return Success": "bg-blue-100 text-blue-700",
};

const SalesProfit = () => {
  const [selectedMonth, setSelectedMonth] = useState("เดือนนี้");
  const [viewMode, setViewMode] = useState<"total" | "by-building">("total");
  const [stats, setStats] = useState<StatPoint[]>([]);
  const [totalStats, setTotalStats] = useState<{ period: number; count: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLabel, setModalLabel] = useState("");
  const [modalBookings, setModalBookings] = useState<DayBooking[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const isYearView = selectedMonth === "ทั้งปี";
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const monthLabel = selectedMonth === "เดือนนี้" ? getCurrentThaiMonth() : selectedMonth;
        const mIdx = isYearView ? null : monthNameToIndex(monthLabel);
        const monthNum = mIdx !== null ? mIdx + 1 : undefined;

        if (viewMode === "by-building") {
          const data = await getBookingStatsByBuilding({
            view: isYearView ? "monthly" : "daily",
            year, month: monthNum,
          });
          setStats(Array.isArray(data) ? data : []);
        } else {
          if (isYearView) {
            const data: { month: number; count: number }[] = await getMonthlyBookingStats();
            setTotalStats((data || []).map((d) => ({ period: d.month, count: Math.round(d.count ?? 0) })));
          } else {
            if (monthNum === undefined) return;
            const data: { day: number; count: number }[] = await getDailyBookingStats(monthNum, year);
            setTotalStats((data || []).map((d) => ({ period: d.day, count: Math.round(d.count ?? 0) })));
          }
        }
      } catch {
        setStats([]); setTotalStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, viewMode]);

  const { series, categories, buildings } = useMemo(() => {
    const monthLabel = selectedMonth === "เดือนนี้" ? getCurrentThaiMonth() : selectedMonth;
    const mIdx = isYearView ? null : monthNameToIndex(monthLabel);

    let categories: string[];
    if (isYearView) {
      categories = THAI_MONTHS;
    } else {
      const m = mIdx !== null ? mIdx + 1 : new Date().getMonth() + 1;
      const days = new Date(year, m, 0).getDate();
      categories = Array.from({ length: days }, (_, i) => String(i + 1));
    }

    if (viewMode === "total") {
      const data = categories.map((_, i) => {
        const period = i + 1;
        const found = totalStats.find((s) => s.period === period);
        return found ? found.count : 0;
      });
      return { series: [{ name: "การจองทั้งหมด", data }], categories, buildings: [] };
    }

    const buildingSet = new Set(stats.map((s) => s.building));
    const buildings = [...buildingSet].sort();
    const series = buildings.map((bld) => ({
      name: bld,
      data: categories.map((_, i) => {
        const found = stats.find((s) => s.building === bld && s.period === i + 1);
        return found ? found.count : 0;
      }),
    }));

    return { series, categories, buildings };
  }, [stats, totalStats, selectedMonth, isYearView, viewMode]);

  const seriesRef = useRef(series);
  const selectedMonthRef = useRef(selectedMonth);
  useEffect(() => { seriesRef.current = series; }, [series]);
  useEffect(() => { selectedMonthRef.current = selectedMonth; }, [selectedMonth]);

  const handleBarClick = useCallback(async (
    _seriesIndex: number,
    dataPointIndex: number
  ) => {
    const sm = selectedMonthRef.current;
    const isYear = sm === "ทั้งปี";
    const curYear = new Date().getFullYear();

    let params: { date?: string; year?: number; month?: number } = {};
    let displayLabel = "";

    if (isYear) {
      params = { year: curYear, month: dataPointIndex + 1 };
      displayLabel = `${THAI_MONTHS[dataPointIndex]} ${curYear + 543}`;
    } else {
      const monthLabel = sm === "เดือนนี้" ? getCurrentThaiMonth() : sm;
      const mIdx = monthNameToIndex(monthLabel);
      if (mIdx < 0) return;
      const day = String(dataPointIndex + 1).padStart(2, "0");
      const mon = String(mIdx + 1).padStart(2, "0");
      params = { date: `${curYear}-${mon}-${day}` };
      displayLabel = `${dataPointIndex + 1} ${monthLabel} ${curYear + 543}`;
    }

    setModalLabel(displayLabel);
    setModalOpen(true);
    setModalLoading(true);
    setModalBookings([]);
    try {
      const data = await getBookingsByDate(params);
      setModalBookings(Array.isArray(data) ? data : []);
    } catch {
      setModalBookings([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const yMax = useMemo(() => {
    if (!series.length) return 5;
    const cats = series[0]?.data.length ?? 0;
    let max = 0;
    for (let i = 0; i < cats; i++) {
      const sum = series.reduce((s, ser) => s + (ser.data[i] ?? 0), 0);
      if (sum > max) max = sum;
    }
    return Math.max(5, Math.ceil(max * 1.25));
  }, [series]);

  const chartOptions: any = useMemo(() => ({
    chart: {
      type: "bar",
      stacked: viewMode === "by-building",
      background: "transparent",
      fontFamily: "Kanit",
      foreColor: "#6b7280",
      animations: { speed: 400 },
      toolbar: { show: false },
      events: {
        dataPointSelection: (
          _e: any,
          _ctx: any,
          { seriesIndex, dataPointIndex }: { seriesIndex: number; dataPointIndex: number }
        ) => {
          if (dataPointIndex >= 0) handleBarClick(seriesIndex, dataPointIndex);
        },
      },
    },
    colors: viewMode === "total"
      ? ["var(--color-primary)"]
      : buildings.map((_, i) => BUILDING_COLORS[i % BUILDING_COLORS.length]),
    plotOptions: {
      bar: { horizontal: false, columnWidth: "60%", borderRadius: 3 },
    },
    dataLabels: { enabled: false },
    fill: { opacity: 0.9 },
    grid: { show: true, strokeDashArray: 3, borderColor: "#E0E0E0" },
    stroke: { show: false },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: isYearView ? -30 : 0,
        hideOverlappingLabels: true,
        style: { fontFamily: "Kanit", fontSize: "11px", colors: "#6b7280" },
      },
    },
    yaxis: {
      min: 0,
      max: yMax,
      labels: {
        formatter: (v: number) => String(Math.round(v)),
        style: { fontFamily: "Kanit", fontSize: "11px", colors: ["#6b7280"] },
      },
    },
    legend: {
      show: viewMode === "by-building",
      position: "bottom",
      horizontalAlign: "left",
      fontFamily: "Kanit",
      fontSize: "12px",
      markers: { size: 8, shape: "circle" },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "dark",
      y: { formatter: (v: number) => `${v} ครั้ง` },
    },
    states: {
      active: { filter: { type: "darken", value: 0.75 } },
    },
  }), [categories, buildings, yMax, isYearView, handleBarClick, viewMode]);

  const titleText = isYearView
    ? `สถิติการใช้สนามรายเดือน${viewMode === "by-building" ? " (แยกอาคาร)" : ""}`
    : `สถิติการใช้สนามรายวัน${viewMode === "by-building" ? " (แยกอาคาร)" : ""}`;

  return (
    <>
      <div className="relative w-full break-words p-0 bg-transparent shadow-none">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h5 className="card-title font-kanit">{titleText}</h5>
            <p className="text-xs text-gray-400 mt-0.5 font-kanit">
              {viewMode === "by-building" ? "แบ่งสีตามอาคาร" : "ยอดรวมทั้งหมด"} · กดแท่งเพื่อดูรายละเอียด
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-kanit">
              <button
                onClick={() => setViewMode("total")}
                className={`px-3 py-1.5 transition ${viewMode === "total" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                รวม
              </button>
              <button
                onClick={() => setViewMode("by-building")}
                className={`px-3 py-1.5 transition border-l border-gray-200 ${viewMode === "by-building" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                แยกตามอาคาร
              </button>
            </div>
            <Select
              id="months"
              className="select-md"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option className="font-kanit" value="เดือนนี้">เดือนนี้</option>
              <option className="font-kanit" value="ทั้งปี">ทั้งปี</option>
              {THAI_MONTHS.map((m) => (
                <option className="font-kanit" value={m} key={m}>{m}</option>
              ))}
            </Select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-[315px] text-gray-400 font-kanit text-sm gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            กำลังโหลดข้อมูล...
          </div>
        )}

        {!loading && series.length === 0 && (
          <div className="flex items-center justify-center h-[315px] text-gray-400 font-kanit text-sm">
            ไม่มีข้อมูลในช่วงเวลานี้
          </div>
        )}

        {!loading && series.length > 0 && (
          <div className="mt-2">
            <div className="flex items-stretch">
              {/* Y-axis label */}
              <div className="flex items-center justify-center pr-1 shrink-0">
                <span
                  className="text-[11px] text-gray-500 font-kanit select-none"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap" }}
                >
                  จำนวนการจอง
                </span>
              </div>
              <div className="flex-1 min-w-0" style={{ cursor: "pointer" }}>
                <Chart
                  options={chartOptions}
                  series={series}
                  type="bar"
                  height="315px"
                  width="100%"
                />
              </div>
            </div>
            {/* X-axis label */}
            <p className="text-center text-[11px] text-gray-500 font-kanit mt-1">
              {isYearView ? "เดือน" : "วันที่"}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-kanit"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">การจอง: {modalLabel}</h2>
                <p className="text-xs text-gray-400 mt-0.5">ทุกสถานะ · ทุกอาคาร</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {modalLoading && (
                <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  กำลังโหลด...
                </div>
              )}
              {!modalLoading && modalBookings.length === 0 && (
                <div className="text-center py-12 text-gray-400">ไม่มีการจองในช่วงเวลานี้</div>
              )}
              {!modalLoading && modalBookings.map((b) => {
                const eStart = new Date(b.startDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
                const eEnd   = new Date(b.endDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
                return (
                  <div key={b.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{b.activityName || "ไม่ระบุกิจกรรม"}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          🏟️ {b.Stadium?.nameStadium ?? "-"}
                          {b.Buildings?.length > 0 && (
                            <span className="ml-2 text-gray-400">· {b.Buildings.map((bd: any) => bd.name).join(", ")}</span>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="text-xs text-gray-400">
                            📅 <span className="font-medium text-gray-700">{eStart === eEnd ? eStart : `${eStart} – ${eEnd}`}</span>
                          </span>
                          <span className="text-xs text-gray-400">
                            🕒 <span className="font-medium text-gray-700">{b.startTime} – {b.endTime}</span>
                          </span>
                        </div>
                        {b.User?.fullname && <p className="text-xs text-gray-400 mt-1">👤 {b.User.fullname}</p>}
                      </div>
                      <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t flex items-center justify-between">
              <span className="text-xs text-gray-400">{modalBookings.length} รายการ</span>
              <button onClick={() => setModalOpen(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesProfit;