"use client";

import { useState } from "react";

type TimeSlot = {
  day: number;
  startHour: number;
  endHour: number;
  subject: string;
  room: string;
  color: string;
};

const MOCK_SCHEDULE: Record<string, TimeSlot[]> = {
  "2568-1": [
    { day: 0, startHour: 8,  endHour: 10, subject: "คณิตศาสตร์",   room: "A101", color: "#f97316" },
    { day: 0, startHour: 13, endHour: 15, subject: "ภาษาอังกฤษ",   room: "B203", color: "#3b82f6" },
    { day: 1, startHour: 9,  endHour: 11, subject: "ฟิสิกส์",       room: "C305", color: "#8b5cf6" },
    { day: 1, startHour: 14, endHour: 16, subject: "เคมี",          room: "Lab1", color: "#10b981" },
    { day: 2, startHour: 8,  endHour: 9,  subject: "พลศึกษา",       room: "สนาม", color: "#f43f5e" },
    { day: 2, startHour: 10, endHour: 12, subject: "ชีววิทยา",      room: "Lab2", color: "#06b6d4" },
    { day: 3, startHour: 9,  endHour: 11, subject: "ประวัติศาสตร์", room: "A202", color: "#f59e0b" },
    { day: 3, startHour: 13, endHour: 15, subject: "ศิลปะ",         room: "D401", color: "#ec4899" },
    { day: 4, startHour: 8,  endHour: 10, subject: "ดนตรี",         room: "D102", color: "#6366f1" },
    { day: 4, startHour: 11, endHour: 13, subject: "คอมพิวเตอร์",  room: "IT01", color: "#0ea5e9" },
  ],
  "2568-2": [
    { day: 0, startHour: 9,  endHour: 11, subject: "สังคมศึกษา",   room: "A103", color: "#f97316" },
    { day: 1, startHour: 8,  endHour: 10, subject: "ภาษาไทย",      room: "B201", color: "#10b981" },
    { day: 2, startHour: 13, endHour: 15, subject: "คณิตศาสตร์",   room: "A101", color: "#f97316" },
    { day: 3, startHour: 8,  endHour: 9,  subject: "พลศึกษา",       room: "สนาม", color: "#f43f5e" },
    { day: 4, startHour: 10, endHour: 12, subject: "ฟิสิกส์",       room: "C305", color: "#8b5cf6" },
  ],
  "2567-1": [],
  "2567-2": [],
};

const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];
const YEARS = [2568, 2567, 2566];

// แต่ละ column คือ 1 ชั่วโมง ตั้งแต่ 6:00 ถึง 22:00
const TIME_COLS: number[] = Array.from({ length: 16 }, (_, i) => i + 6); // [6,7,...,21]

const DAY_ROW_HEIGHT = 56;  // px สูงของแต่ละแถววัน
const TIME_COL_WIDTH = 64;  // px กว้างของแต่ละ column เวลา
const DAY_LABEL_WIDTH = 80; // px กว้างของ column ชื่อวัน

const ClassSchedule = () => {
  const [selectedYear, setSelectedYear] = useState(2568);
  const [selectedTerm, setSelectedTerm] = useState(1);

  const scheduleKey = `${selectedYear}-${selectedTerm}`;
  const slots = MOCK_SCHEDULE[scheduleKey] ?? [];

  const slotsByDay: Record<number, TimeSlot[]> = {};
  slots.forEach((s) => {
    if (!slotsByDay[s.day]) slotsByDay[s.day] = [];
    slotsByDay[s.day].push(s);
  });

  const totalWidth = DAY_LABEL_WIDTH + TIME_COLS.length * TIME_COL_WIDTH;

  return (
    <div className="font-kanit">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">ปีการศึกษา</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">ภาคที่</span>
          <div className="flex gap-2">
            {[1, 2, 3].map((term) => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={`w-10 h-9 rounded-md text-sm font-semibold border transition-all
                  ${selectedTerm === term
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
                  }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center bg-orange-50 border border-orange-200 rounded-md px-3 py-1.5">
          <span className="text-xs text-orange-600 font-medium">
            {slots.length > 0 ? `${slots.length} วิชา` : "ไม่มีข้อมูล"}
          </span>
        </div>
      </div>

      {/* Grid — horizontal scroll */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div style={{ width: totalWidth }}>

            {/* ===== ROW 1: TIME HEADER (top) ===== */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {/* corner */}
              <div
                className="shrink-0 border-r border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-medium"
                style={{ width: DAY_LABEL_WIDTH, height: 36 }}
              >
                วัน/เวลา
              </div>
              {/* time labels */}
              {TIME_COLS.map((h) => (
                <div
                  key={h}
                  className="shrink-0 border-r border-gray-200 last:border-r-0 flex items-center justify-center text-[10px] text-gray-500"
                  style={{ width: TIME_COL_WIDTH, height: 36 }}
                >
                  {`${h}:00`}
                </div>
              ))}
            </div>

            {/* ===== ROWS 2–6: DAY ROWS ===== */}
            {DAYS.map((dayName, dayIdx) => (
              <div
                key={dayIdx}
                className="flex border-b border-gray-100 last:border-b-0"
                style={{ height: DAY_ROW_HEIGHT }}
              >
                {/* Day label (left) */}
                <div
                  className="shrink-0 border-r border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-semibold text-gray-600"
                  style={{ width: DAY_LABEL_WIDTH }}
                >
                  {dayName}
                </div>

                {/* Timeline area for this day */}
                <div
                  className="relative"
                  style={{ width: TIME_COLS.length * TIME_COL_WIDTH }}
                >
                  {/* vertical grid lines per hour */}
                  {TIME_COLS.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-gray-100"
                      style={{ left: i * TIME_COL_WIDTH, width: TIME_COL_WIDTH }}
                    />
                  ))}

                  {/* subject slots */}
                  {(slotsByDay[dayIdx] ?? []).map((slot, sIdx) => {
                    const colStart = slot.startHour - 6;
                    const spanCols = slot.endHour - slot.startHour;
                    return (
                      <div
                        key={sIdx}
                        className="absolute top-1 bottom-1 rounded-md px-2 py-1 overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                        style={{
                          left: colStart * TIME_COL_WIDTH + 2,
                          width: spanCols * TIME_COL_WIDTH - 4,
                          backgroundColor: slot.color + "22",
                          borderLeft: `3px solid ${slot.color}`,
                        }}
                      >
                        <p
                          className="text-[11px] font-semibold leading-tight truncate"
                          style={{ color: slot.color }}
                        >
                          {slot.subject}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{slot.room}</p>
                        <p className="text-[10px] text-gray-400">
                          {slot.startHour}:00–{slot.endHour}:00
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      {slots.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {slots.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: s.color + "20", color: s.color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.subject}
            </span>
          ))}
        </div>
      )}

      {slots.length === 0 && (
        <div className="mt-6 text-center text-gray-400 text-sm py-8">
          ไม่มีข้อมูลตารางเรียนในภาคเรียนนี้
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-400">
        หมายเหตุ : ข้อมูลที่แสดงคือ &quot;รหัสวิชา (Sec.) ห้องเรียน&quot;
      </p>
    </div>
  );
};

export default ClassSchedule;
