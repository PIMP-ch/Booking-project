"use client";
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Select } from "flowbite-react";
import { getMonthlyBookingStats, getDailyBookingStats } from "@/utils/api";

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

const SalesProfit = () => {
  const [series, setSeries] = useState<ChartSeries>({
    name: "การจอง",
    type: "bar",
    data: [],
  });
  const [selectedMonth, setSelectedMonth] = useState<string>("เดือนนี้");

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

  const yMax = useMemo(() => {
    const maxY = series.data.reduce((m, p) => Math.max(m, p.y ?? 0), 0);
    // ปัดขึ้นเป็นเลขเต็มเสมอ แล้วบวก padding
    // เพิ่ม 50% padding เพื่อให้ label position:top มีพื้นที่เหนือแท่ง
    return Math.max(5, Math.ceil(maxY * 1.5));
  }, [series]);

  const chartOptions: any = useMemo(
    () => ({
      chart: {
        background: "transparent",
        fontFamily: "Kanit",
        foreColor: "#adb0bb",
        fontSize: "12px",
        animations: { speed: 500 },
        toolbar: { show: false },
      },
      colors: ["var(--color-primary)", "#adb0bb35"],

      // ── Label เหนือแท่ง: offsetY ลบ = ดันขึ้นไปนอกแท่ง ──────
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
            position: "top",   // ApexCharts bar-specific: วาง label ที่ top ของแท่ง
          },
        },
      },

      fill: { type: "solid", opacity: 0.85 },
      grid: { show: true, strokeDashArray: 3, borderColor: "#E0E0E0" },
      stroke: { show: false },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { rotate: 0, hideOverlappingLabels: true },
      },

      // ── Y-axis เลขหลักหน่วย เฉลี่ยเท่ากัน ──────────────────
      yaxis: {
        min: 0,
        max: yMax,
        // tickAmount = จำนวน interval ที่หาร yMax ลงตัว ไม่เกิน 5
        // เช่น yMax=10 → tickAmount=5 (ช่องละ 2), yMax=6 → tickAmount=3 (ช่องละ 2)
        tickAmount: (() => {
          if (yMax <= 5) return yMax;          // 1 ต่อ 1
          for (const t of [5, 4, 2]) {
            if (yMax % t === 0) return t;      // หาร yMax ลงตัว
          }
          return 5;                            // fallback
        })(),
        labels: {
          formatter: (val: number) => String(Math.round(val)),
        },
      },

      legend: { show: false },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val: number) => `${Math.round(val)} คน`,   // tooltip บอกหน่วย
        },
      },
    }),
    [yMax]
  );

  const titleText = useMemo(() => {
    if (selectedMonth === "ทั้งปี") return "ยอดการจองรายเดือน (ทั้งปี)";
    return "ยอดการจองรายวัน";
  }, [selectedMonth]);

  return (
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

      <div className="-ms-4 -me-3 mt-2">
        <Chart
          options={chartOptions}
          series={[series]}
          type="bar"
          height="315px"
          width="100%"
        />
      </div>
    </div>
  );
};

export default SalesProfit;
