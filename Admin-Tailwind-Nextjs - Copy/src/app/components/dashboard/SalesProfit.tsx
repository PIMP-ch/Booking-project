"use client";
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Select, Tooltip } from "flowbite-react";
import { getMonthlyBookingStats, getDailyBookingStats} from "@/utils/api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartDataPoint {
  x: string; // Month
  y: number; // Count of bookings
}

interface ChartSeries {
  name: string;
  type: "area" | "line" | "bar";
  data: ChartDataPoint[];
}

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const monthNameToIndex = (name:string): number | null => {
  const idx = THAI_MONTHS.indexOf(name);
  return idx >= 0 ?idx : null;
};

const getCurrentThaiMonthName = () => THAI_MONTHS[new Date().getMonth()];

const SalesProfit = () => {
  const [series, setSeries] = useState<ChartSeries>({
    name: "การจอง",
    type: "area",
    data: [],
  });
  const [selectedMonth, setSelectedMonth] = useState<string>("เดือนนี้");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (selectedMonth === "ทั้งปี") {
          const stats: {month: number; count: number}[] = await getMonthlyBookingStats();

          const monthly: ChartDataPoint[] = THAI_MONTHS.map((label) => ({ x: label, y: 0}));
          stats.forEach(({month, count}) => {
            const i = month - 1;
            if (i >= 0 && i < monthly.length) monthly[i].y = count ?? 0;
          });

          setSeries({name: "การจอง", type: "area", data: monthly});
        } else {
          const monthLabel = selectedMonth === "เดือนนี้" ? getCurrentThaiMonthName() : selectedMonth;
          const mIdx = monthNameToIndex(monthLabel);
          if (mIdx === null) return;

          const year = new Date().getFullYear();
          const month1Based = mIdx + 1;

          const stats: {day: number; count: number}[] = await getDailyBookingStats(month1Based, year);

          const daysInMonth = new Date(year, month1Based, 0).getDate();
          const daily: ChartDataPoint[] = Array.from({length: daysInMonth}, (_, i) => ({
            x: String(i + 1),
            y: 0,
          }));

          stats.forEach(({day, count}) => {
            if (day >= 1 && day <= daysInMonth) daily[day - 1].y  = count ?? 0;
          });

          setSeries({name: "การจอง", type: "area",  data: daily});
        }
      } catch  (err) {
        console.error("Error fetching  booking stats:", err);
        setSeries({name: "การจอง", type: "area", data: []});
      }
    };

    fetchStats();
  }, [selectedMonth]);

  const yMax = useMemo(() => {
    const maxY = series.data.reduce((m, p) => Math.max(m, p.y ?? 0), 0);
    const padded = Math.max(5, Math.ceil(maxY * 1.25));
    return padded;
  }, [series]);

  const chartOptions: any = useMemo(
    () => ({
      chart: {
        background: "transparent",
        fontFamily: "Kanit",
        foreColor: "#adb0bb",
        fontSize: "12px",
        animations: { speed: 500},
        toolbar: {show: false},
      },
      colors: ["var(--color-primary)","#adb0bb35"],
      dataLabels: {enabled: false},
      fill: {
        type: "gradient",
        gradient: {shadeIntensity: 0, opacityFrom: 0.1, opacityTo: 0.255, stops: [100]},
      },
      grid: {show: true, strokeDashArray: 3, borderColor: "#E0E0E0"},
      stroke: {curve: "smooth", width: 2},
      xaxis: {
        axisBorder: {show: false},
        axisTicks: {show: false},
        labels: {
          rotate: 0,
          hideOverlappingLabels: true,
        },
      },
      yaxis: {min: 0, max: yMax, tickAmount: 4},
      legend: {show: false},
      tooltip: {theme: "dark"},
    }),
    [yMax]
  );

  const titleText = useMemo(() => {
    if (selectedMonth === "ทั้งปี") return "ยอดการจองรายเดือน (ทั้งปี)";
    if (selectedMonth === "เดือนนี้") return 'ยอดการของรายวัน';
    return 'ยอดการจองรายวัน';
  }, [selectedMonth]);

  return(
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
          type="area"
          height="315px"
          width="100%"
        ></Chart>
      </div>

      {selectedMonth !== "ทั้งปี" && series.data.length > 0 && (
        <p className="text-xs text-gray-500 mt-2 font-kanit">
          แสดงผลเป็นรายวันของเดือนที่เลือก - ต้องการสรุปค่าเฉลี่ย/ผลรวมของเดือนนี้ใต้กราฟหรือไม่?
        </p>
      )}
    </div>
  );
};
export default SalesProfit;