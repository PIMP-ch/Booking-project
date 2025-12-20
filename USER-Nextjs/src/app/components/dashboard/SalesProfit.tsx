"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Select } from "flowbite-react";
import { getMonthlyBookingStats } from "@/utils/api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartDataPoint {
  x: string; // Month
  y: number; // Count of bookings
}

interface ChartSeries {
  name: string;
  type: string;
  data: ChartDataPoint[];
}

const SalesProfit = () => {
  const [areaChart, setAreaChart] = useState<{ series: ChartSeries[] }>({
    series: [],
  });

  const [optionscolumnchart, setOptionsColumnChart] = useState<any>({
    chart: {
      fontFamily: "Kanit",
      foreColor: "#adb0bb",
      fontSize: "12px",
      animations: { speed: 500 },
      toolbar: { show: false },
    },
    colors: ["var(--color-primary)", "#adb0bb35"],
    dataLabels: { enabled: false },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 0, opacityFrom: 0.1, opacityTo: 0.3, stops: [100] },
    },
    grid: { show: true, strokeDashArray: 3, borderColor: "#90A4AE50" },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: 0, max: 100, tickAmount: 4 },
    legend: { show: false },
    tooltip: { theme: "dark" },
  });

  const [selectedYear, setSelectedYear] = useState<string>("ปีนี้");

  useEffect(() => {
    fetchMonthlyBookingStats();
  }, [selectedYear]);

  // Fetch data from the backend
  const fetchMonthlyBookingStats = async () => {
    try {
      const stats = await getMonthlyBookingStats();
      const formattedData = formatStatsForChart(stats);
      setAreaChart({
        series: [
          {
            name: "การจอง",
            type: "area",
            data: formattedData,
          },
        ],
      });
    } catch (err) {
      console.error("Error fetching monthly booking stats:", err);
    }
  };

  // Format stats for the chart
  const formatStatsForChart = (stats: { month: number; count: number }[]) => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    ];

    // Create a default dataset with all months set to 0
    const defaultData = months.map((month, index) => ({
      x: month, // Month name in Thai
      y: 0, // Default count
    }));

    // Overwrite default data with stats from the API
    stats.forEach(({ month, count }) => {
      defaultData[month - 1].y = count; // `month - 1` because months in stats are 1-based
    });

    return defaultData;
  };

  return (
    <div className="rounded-lg dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <div className="flex justify-between items-center">
        <h5 className="card-title font-kanit">ยอดการจองรายเดือน</h5>
        <Select
          id="years"
          className="select-md"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          required
        >
          <option className="font-kanit" value="ปีนี้">ปีนี้</option>
        </Select>
      </div>

      <div className="-ms-4 -me-3 mt-2">
        <Chart
          options={optionscolumnchart}
          series={areaChart.series}
          type="area"
          height="315px"
          width="100%"
        />
      </div>
    </div>
  );
};

export default SalesProfit;
