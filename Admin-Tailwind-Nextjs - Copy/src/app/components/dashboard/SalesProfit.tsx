"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Select } from "flowbite-react";
import { getMonthlyBookingStats, getDailyBookingStats, getBookingsByDate } from "@/utils/api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartDataPoint {
  x: string;
  y: number;
}

interface ChartSeries {
  name: string;
  type: "bar";
  data: ChartDataPoint[];
}

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

const monthNameToIndex = (name: string): number | null => {
  const idx = THAI_MONTHS.indexOf(name);
  return idx >= 0 ? idx : null;
};

const getCurrentThaiMonthName = () => THAI_MONTHS[new Date().getMonth()];

interface DayBooking {
  id: string;
  activityName: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: string;
  Stadium: { nameStadium: string } | null;
  Buildings: { name: string }[];
  User: { fullname: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending:          "รอยืนยัน",
  confirmed:        "ยืนยันแล้ว",
  canceled:         "ยกเลิก",
  "Return Success": "คืนเรียบร้อย",
};

const STATUS_COLOR: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-700",
  confirmed:        "bg-green-100 text-green-700",
  canceled:         "bg-red-100 text-red-600",
  "Return Success": "bg-blue-100 text-blue-700",
};

const SalesProfit = () => {
  const [series, setSeries] = useState<ChartSeries>({
    name: "การจอง",
    type: "bar",
    data: [],
  });
  const [selectedMonth, setSelectedMonth] = useState<string>("เดือนนี้");

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalLabel, setModalLabel]     = useState("");
  const [modalBookings, setModalBookings] = useState<DayBooking[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (selectedMonth === "ทั้งปี") {
          const stats: { month: number; count: number }[] = await getMonthlyBookingStats();
          const monthly: ChartDataPoint[] = THAI_MONTHS.map((label) => ({ x: label, y: 0 }));
          stats.forEach(({ month, count }) => {
            const i = month - 1;
            if (i >= 0 && i < monthly.length) monthly[i].y = Math.round(count ?? 0);
          });
          setSeries({ name: "การจอง", type: "bar", data: monthly });
        } else {
          const monthLabel = selectedMonth === "เดือนนี้" ? getCurrentThaiMonthName() : selectedMonth;
          const mIdx = monthNameToIndex(monthLabel);
          if (mIdx === null) return;

          const year = new Date().getFullYear();
          const month1Based = mIdx + 1;
          const stats: { day: number; count: number }[] = await getDailyBookingStats(month1Based, year);

          const daysInMonth = new Date(year, month1Based, 0).getDate();
          const daily: ChartDataPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
            x: String(i + 1),
            y: 0,
          }));
          stats.forEach(({ day, count }) => {
            if (day >= 1 && day <= daysInMonth) daily[day - 1].y = Math.round(count ?? 0);
          });
          setSeries({ name: "การจอง", type: "bar", data: daily });
        }
      } catch (err) {
        console.error("Error fetching booking stats:", err);
        setSeries({ name: "การจอง", type: "bar", data: [] });
      }
    };

    fetchStats();
  }, [selectedMonth]);

  // ── เก็บ series + selectedMonth ใน ref เพื่อให้ events closure ไม่ stale ──────
  const seriesRef       = useRef(series);
  const selectedMonthRef = useRef(selectedMonth);
  useEffect(() => { seriesRef.current = series; },         [series]);
  useEffect(() => { selectedMonthRef.current = selectedMonth; }, [selectedMonth]);

  const handleBarClick = useCallback(async (dataPointIndex: number) => {
    const label = seriesRef.current.data[dataPointIndex]?.x;
    if (!label) return;

    const now           = new Date();
    const currentYear   = now.getFullYear();
    const sm            = selectedMonthRef.current;
    const isYearView    = sm === "ทั้งปี";

    let params: { date?: string; year?: number; month?: number } = {};
    let displayLabel = "";

    if (isYearView) {
      // label = ชื่อเดือนภาษาไทย → หา index
      const mIdx = THAI_MONTHS.indexOf(label as string);
      if (mIdx < 0) return;
      params = { year: currentYear, month: mIdx + 1 };
      displayLabel = `${label} ${currentYear + 543}`;
    } else {
      // label = เลขวัน → สร้าง date string
      const monthLabel = sm === "เดือนนี้" ? getCurrentThaiMonthName() : sm;
      const mIdx       = monthNameToIndex(monthLabel);
      if (mIdx === null) return;
      const day  = String(label).padStart(2, "0");
      const mon  = String(mIdx + 1).padStart(2, "0");
      params = { date: `${currentYear}-${mon}-${day}` };
      displayLabel = `${label} ${monthLabel} ${currentYear + 543}`;
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
    const maxY = series.data.reduce((m, p) => Math.max(m, p.y ?? 0), 0);
    return Math.max(5, Math.ceil(maxY * 1.5));
  }, [series]);

  const isYearView = selectedMonth === "ทั้งปี";

  const chartOptions: any = useMemo(
    () => ({
      chart: {
        background: "transparent",
        fontFamily: "Kanit",
        foreColor: "#adb0bb",
        fontSize: "12px",
        animations: { speed: 500 },
        toolbar: { show: false },
        events: {
          dataPointSelection: (_e: any, _ctx: any, { dataPointIndex }: { dataPointIndex: number }) => {
            if (dataPointIndex >= 0) handleBarClick(dataPointIndex);
          },
        },
      },
      colors: ["var(--color-primary)", "#adb0bb35"],

      dataLabels: {
        enabled: true,
        formatter: (val: number) => (val === 0 ? "" : String(Math.round(val))),
        offsetY: -20,
        style: {
          fontSize: "12px",
          fontFamily: "Kanit",
          fontWeight: "700",
          colors: ["#111827"],
        },
        background: { enabled: false },
        dropShadow: { enabled: false },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
          },
        },
      },

      fill: { type: "solid", opacity: 0.85 },
      grid: { show: true, strokeDashArray: 3, borderColor: "#E0E0E0" },
      stroke: { show: false },

      // X-axis ล่าง — label วันที่/เดือนแนวนอน ใต้เส้นแนวตั้งแต่ละแท่ง
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: 0,
          hideOverlappingLabels: true,
          style: {
            fontFamily: "Kanit",
            fontSize: "12px",
            colors: "#adb0bb",
          },
        },
        title: {
          text: isYearView ? "เดือน" : "วันที่",
          style: {
            fontFamily: "Kanit",
            fontSize: "12px",
            color: "#adb0bb",
            fontWeight: 400,
          },
          offsetY: 4,
        },
      },

      // Y-axis ซ้าย — จำนวนการจอง
      yaxis: {
        opposite: false,
        min: 0,
        max: yMax,
        tickAmount: (() => {
          if (yMax <= 5) return yMax;
          for (const t of [5, 4, 2]) {
            if (yMax % t === 0) return t;
          }
          return 5;
        })(),
        labels: {
          formatter: (val: number) => String(Math.round(val)),
          style: {
            fontFamily: "Kanit",
            fontSize: "12px",
            colors: ["#adb0bb"],
          },
        },
        title: {
          text: "จำนวนการจอง",
          style: {
            fontFamily: "Kanit",
            fontSize: "12px",
            color: "#adb0bb",
            fontWeight: 400,
          },
        },
      },

      legend: { show: false },
      tooltip: {
        theme: "dark",
        y: { formatter: (val: number) => `${Math.round(val)} คน` },
      },
      states: {
        active: { filter: { type: "darken", value: 0.8 } },
      },
    }),
    [yMax, isYearView, handleBarClick]
  );

  const titleText = useMemo(() => {
    if (selectedMonth === "ทั้งปี") return "ยอดการจองรายเดือน (ทั้งปี)";
    return "ยอดการจองรายวัน";
  }, [selectedMonth]);

  return (
    <>
      <div className="relative w-full break-words p-0 bg-transparent shadow-none">
        <div className="flex justify-between items-center">
          <h5 className="card-title font-kanit">{titleText}</h5>
          <Select
            id="months"
            className="select-md"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            required
          >
            <option className="font-kanit" value="เดือนนี้">เดือนนี้</option>
            <option className="font-kanit" value="ทั้งปี">ทั้งปี</option>
            {THAI_MONTHS.map((m) => (
              <option className="font-kanit" value={m} key={m}>{m}</option>
            ))}
          </Select>
        </div>

        <p className="text-xs text-gray-400 mt-1 font-kanit">กดที่แท่งกราฟเพื่อดูรายละเอียดการจอง</p>

        <div className="-ms-4 -me-3 mt-2" style={{ cursor: "pointer" }}>
          <Chart
            options={chartOptions}
            series={[series]}
            type="bar"
            height="315px"
            width="100%"
          />
        </div>
      </div>

      {/* ── Modal รายละเอียดการจองตามวัน ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-kanit"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">จองเมื่อ {modalLabel}</h2>
                <p className="text-xs text-gray-400 mt-0.5">รายการที่ถูกสร้างในช่วงเวลานี้ (ทุกสถานะ)</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {modalLoading && (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  กำลังโหลด...
                </div>
              )}

              {!modalLoading && modalBookings.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  ไม่มีการจองในช่วงเวลานี้
                </div>
              )}

              {!modalLoading && modalBookings.map((b) => {
                const eventStart = new Date(b.startDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
                const eventEnd   = new Date(b.endDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
                const sameDay    = eventStart === eventEnd;
                return (
                  <div key={b.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">

                        {/* กิจกรรม + สนาม */}
                        <p className="font-semibold text-gray-800 truncate">
                          {b.activityName || "ไม่ระบุกิจกรรม"}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          🏟️ {b.Stadium?.nameStadium ?? "-"}
                          {b.Buildings?.length > 0 && (
                            <span className="ml-2 text-gray-400">
                              · {b.Buildings.map((bd: any) => bd.name).join(", ")}
                            </span>
                          )}
                        </p>

                        {/* กำหนดใช้งาน — แยกชัดเจน */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="text-xs text-gray-400">
                            📅 กำหนดใช้งาน:{" "}
                            <span className="font-medium text-gray-700">
                              {sameDay ? eventStart : `${eventStart} – ${eventEnd}`}
                            </span>
                          </span>
                          <span className="text-xs text-gray-400">
                            🕒 เวลา:{" "}
                            <span className="font-medium text-gray-700">
                              {b.startTime} – {b.endTime}
                            </span>
                          </span>
                        </div>

                        {/* ผู้จอง */}
                        {b.User?.fullname && (
                          <p className="text-xs text-gray-400 mt-1">👤 {b.User.fullname}</p>
                        )}
                      </div>

                      <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t text-right">
              <span className="text-xs text-gray-400 mr-4">
                ทั้งหมด {modalBookings.length} รายการ
              </span>
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
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
