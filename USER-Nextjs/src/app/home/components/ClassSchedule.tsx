"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────

type SubjectBlock = {
  id: number;
  dayRow: number;
  startHour: number;
  endHour: number;
  subject: string;
  room: string;
  color: string;
  fromDB?: boolean;
  dbStatus?: string;
};

type FormState = {
  dayRow: number;
  startHour: number;
  endHour: number;
  subject: string;
  room: string;
  color: string;
};

type DBBooking = {
  id: number;
  name: string;
  activityName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  bookingType: string;
  academicYear: number | null;
  academicTerm: number | null;
};

type Stadium = {
  id: number;
  nameStadium: string;
  statusStadium: string;
  buildingIds: number[];
};

type Building = {
  id: number;
  name: string;
  active: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const API = "http://localhost:5008";

const DAYS = [
  { label: "จันทร์",    row: 2, dow: 1, accent: "#ffc107" },
  { label: "อังคาร",   row: 3, dow: 2, accent: "#e83e8c" },
  { label: "พุธ",      row: 4, dow: 3, accent: "#28a745" },
  { label: "พฤหัสบดี", row: 5, dow: 4, accent: "#fd7e14" },
  { label: "ศุกร์",    row: 6, dow: 5, accent: "#00bcd4" },
  { label: "เสาร์",    row: 7, dow: 6, accent: "#6f42c1" },
  { label: "อาทิตย์",  row: 8, dow: 0, accent: "#dc3545" },
];

const DOW_TO_ROW: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 0: 8 };
const ROW_TO_DOW: Record<number, number> = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 0 };

const START_HOUR    = 6;
const END_HOUR      = 22;
const HOURS         = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const START_OPTIONS = HOURS.slice(0, HOURS.length - 1);
const END_OPTIONS   = HOURS.slice(1);

const COLOR_PRESETS = ["#ffc107","#e83e8c","#28a745","#fd7e14","#00bcd4","#6f42c1","#dc3545","#007bff"];
const YEAR_OPTIONS  = [2568, 2567, 2566];
const TERM_OPTIONS  = [1, 2, 3];

let uid = 100;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(date: Date) {
  return date.toISOString().split("T")[0];
}

function getMondayOf(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function getDatesInRange(rangeStart: string, rangeEnd: string, dow: number): string[] {
  const result: string[] = [];
  const end = new Date(rangeEnd);
  let cur = new Date(rangeStart);
  while (cur.getDay() !== dow) cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    result.push(toYMD(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return result;
}

function mapDBBooking(b: DBBooking): SubjectBlock {
  const dow       = new Date(b.startDate).getDay();
  const dayRow    = DOW_TO_ROW[dow] ?? 2;
  const startHour = Number(b.startTime.split(":")[0]);
  const endHour   = Number(b.endTime.split(":")[0]);
  const room      = b.activityName.includes("| ห้อง")
    ? b.activityName.split("| ห้อง")[1]?.split("|")[0]?.trim() ?? ""
    : "";
  return {
    id: b.id, dayRow, startHour, endHour,
    subject: b.name, room,
    color: b.status === "confirmed" ? "#28a745" : "#6c757d",
    fromDB: true, dbStatus: b.status,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ClassScheduleForm() {
  // ── ข้อมูลผู้ใช้จาก session/localStorage (ปรับให้ตรงกับระบบ auth ของคุณ)
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; userType: string } | null>(null);
  const isStaff = currentUser?.userType === "staff";

  // ── ภาคการศึกษา
  const [selectedYear, setSelectedYear] = useState(2568);
  const [selectedTerm, setSelectedTerm] = useState(2);

  const today = new Date();
  const [rangeStart, setRangeStart] = useState(toYMD(getMondayOf(today)));
  const [rangeEnd, setRangeEnd]     = useState(() => {
    const d = getMondayOf(today);
    d.setMonth(d.getMonth() + 4);
    return toYMD(d);
  });

  // ── สนาม / อาคาร
  const [stadiums, setStadiums]       = useState<Stadium[]>([]);
  const [buildings, setBuildings]     = useState<Building[]>([]);
  const [selectedStadiumId, setSelectedStadiumId] = useState<number | "">("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | "">("");
  const [loadingStadiums, setLoadingStadiums] = useState(false);

  // ── ตาราง
  const [blocks, setBlocks]           = useState<SubjectBlock[]>([]);
  const [savedBlocks, setSavedBlocks] = useState<SubjectBlock[]>([]);
  const [previewWeek, setPreviewWeek] = useState(toYMD(getMondayOf(today)));
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saveResult, setSaveResult]   = useState<{ total: number; skipped: string[] } | null>(null);

  const [form, setForm] = useState<FormState>({
    dayRow: 2, startHour: 9, endHour: 12,
    subject: "", room: "", color: "#ffc107",
  });

  // ─── ดึง user จาก localStorage (ปรับตาม auth จริงของโปรเจกต์) ────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user") || localStorage.getItem("userData");
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUser({
          id:       u.id ?? u.userId ?? u.user_id,
          name:     u.fullname ?? u.name ?? u.username ?? "ผู้ใช้",
          userType: u.userType ?? u.user_type ?? "",
        });
      }
    } catch {
      // ถ้าอ่านไม่ได้ก็ปล่อยผ่าน
    }
  }, []);

  // ─── ดึงรายการสนาม ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingStadiums(true);
    axios.get<Stadium[]>(`${API}/api/stadiums`)
      .then(({ data }) => setStadiums(Array.isArray(data) ? data : []))
      .catch(() => setStadiums([]))
      .finally(() => setLoadingStadiums(false));
  }, []);

  // ─── ดึงอาคารที่เชื่อมกับสนามที่เลือก ─────────────────────────────────────
  useEffect(() => {
    setSelectedBuildingId("");
    setBuildings([]);
    if (!selectedStadiumId) return;

    // ดึงจาก stadium detail (มี buildingIds อยู่แล้ว)
    const stadium = stadiums.find(s => s.id === selectedStadiumId);
    if (!stadium?.buildingIds?.length) {
      // fallback: ดึงอาคารทั้งหมด
      axios.get<Building[]>(`${API}/api/buildings`)
        .then(({ data }) => setBuildings(Array.isArray(data) ? data.filter(b => b.active) : []))
        .catch(() => setBuildings([]));
      return;
    }

    // ดึง stadium detail เพื่อเอาชื่ออาคาร
    axios.get<{ buildings: { id: number; name: string }[] }>(`${API}/api/stadiums/${selectedStadiumId}`)
      .then(({ data }) => {
        const mapped: Building[] = (data.buildings || []).map(b => ({
          id: b.id, name: b.name, active: true,
        }));
        setBuildings(mapped);
      })
      .catch(() => {
        // fallback: ดึงทั้งหมด
        axios.get<Building[]>(`${API}/api/buildings`)
          .then(({ data }) => setBuildings(Array.isArray(data) ? data.filter(b => b.active) : []))
          .catch(() => setBuildings([]));
      });
  }, [selectedStadiumId, stadiums]);

  // ─── Fetch preview ──────────────────────────────────────────────────────────
  const fetchSaved = async (year: number, term: number, week: string) => {
    setLoadingSchedule(true);
    setFetchError(null);
    try {
      const { data } = await axios.get<DBBooking[]>(
        `${API}/api/bookings/class-schedules`,
        { params: { weekStart: week, year, term } }
      );
      setSavedBlocks(Array.isArray(data) ? data.map(mapDBBooking) : []);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.message ?? e.message
        : "โหลดข้อมูลไม่สำเร็จ";
      setFetchError(msg);
      setSavedBlocks([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchSaved(selectedYear, selectedTerm, previewWeek);
  }, [selectedYear, selectedTerm, previewWeek]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const updateForm = (key: keyof FormState, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleAdd = () => {
    if (!form.subject.trim()) { setError("กรุณากรอกรหัสวิชา"); return; }
    if (form.startHour >= form.endHour) { setError("เวลาเริ่มต้องน้อยกว่าเวลาจบ"); return; }
    setError(null);
    setSaveResult(null);
    setBlocks(prev => [...prev, { ...form, id: uid++ }]);
  };

  const handleDelete = (id: number) =>
    setBlocks(prev => prev.filter(b => b.id !== id));

  const handleSave = async () => {
    if (!currentUser?.id) { setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน"); return; }
    if (currentUser.userType !== "staff") { setError("เฉพาะเจ้าหน้าที่ (staff) เท่านั้นที่สามารถจองตารางเรียนได้"); return; }
    if (!selectedStadiumId)  { setError("กรุณาเลือกสนาม"); return; }
    if (!selectedBuildingId) { setError("กรุณาเลือกอาคาร"); return; }
    if (blocks.length === 0) return;
    if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) {
      setError("กรุณาเลือกช่วงวันที่ให้ถูกต้อง"); return;
    }

    setSaving(true);
    setError(null);
    setSaveResult(null);

    try {
      const expandedBlocks = blocks.flatMap(b => {
        const dow   = ROW_TO_DOW[b.dayRow];
        const dates = getDatesInRange(rangeStart, rangeEnd, dow);
        return dates.map(date => ({
          date,
          dayRow:    b.dayRow,
          startHour: b.startHour,
          endHour:   b.endHour,
          subject:   b.subject,
          room:      b.room,
        }));
      });

      const { data } = await axios.post(`${API}/api/bookings/class-schedules`, {
        year:       selectedYear,
        term:       selectedTerm,
        rangeStart,
        rangeEnd,
        userId:     currentUser.id,       // ← ผู้ใช้จริง
        stadiumId:  selectedStadiumId,    // ← สนามที่เลือก
        buildingId: selectedBuildingId,   // ← อาคารที่เลือก
        blocks:     expandedBlocks,
      });

      setBlocks([]);
      setSaveResult({
        total:   data.totalCreated ?? expandedBlocks.length,
        skipped: data.skipped ?? [],
      });
      await fetchSaved(selectedYear, selectedTerm, previewWeek);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.message ?? e.message
        : "เกิดข้อผิดพลาด";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const expandedCount = blocks.reduce((sum, b) => {
    const dow = ROW_TO_DOW[b.dayRow];
    return sum + getDatesInRange(rangeStart, rangeEnd, dow).length;
  }, 0);

  const selectedStadium = stadiums.find(s => s.id === selectedStadiumId);
  const allBlocks = [...blocks, ...savedBlocks];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-['Sarabun',sans-serif]">

      <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center">
        <span className="font-semibold text-base text-gray-800">
          ระบบสารสนเทศเพื่องานทะเบียนนักศึกษา
        </span>
        {currentUser ? (
          <span className="text-sm text-gray-500 flex items-center gap-2">
            👤 {currentUser.name}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isStaff
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {currentUser.userType}
            </span>
          </span>
        ) : (
          <span className="text-xs text-red-400">⚠️ ไม่พบข้อมูลผู้ใช้</span>
        )}
      </header>

      {/* ── Access Guard ── */}
      {currentUser && !isStaff && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-3 text-sm text-red-700">
          <span className="text-lg">🔒</span>
          <div>
            <p className="font-semibold">ไม่มีสิทธิ์เข้าถึง</p>
            <p className="text-xs text-red-500">หน้านี้สำหรับเจ้าหน้าที่ (staff) เท่านั้น บัญชีของคุณเป็น <strong>{currentUser.userType}</strong></p>
          </div>
        </div>
      )}

      <div className={`p-6 space-y-4 ${currentUser && !isStaff ? "pointer-events-none opacity-40 select-none" : ""}`}>

        {/* ── ภาค + ช่วงวันที่ ── */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">ข้อมูลภาคการศึกษา</p>
          <div className="flex flex-wrap gap-4 items-end">

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">ปีการศึกษา</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">ภาคการศึกษา</label>
              <select
                value={selectedTerm}
                onChange={e => setSelectedTerm(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {TERM_OPTIONS.map(t => <option key={t} value={t}>ภาค {t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">วันเริ่มต้นภาค</label>
              <input
                type="date"
                value={rangeStart}
                onChange={e => setRangeStart(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-end pb-2 text-gray-400 text-sm">→</div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">วันสิ้นสุดภาค</label>
              <input
                type="date"
                value={rangeEnd}
                min={rangeStart}
                onChange={e => setRangeEnd(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {rangeStart && rangeEnd && rangeStart <= rangeEnd && (
              <span className="self-end pb-2 text-xs text-blue-600 font-medium">
                ≈ {Math.round((new Date(rangeEnd).getTime() - new Date(rangeStart).getTime()) / (7 * 86400000))} สัปดาห์
              </span>
            )}
          </div>
        </div>

        {/* ── เลือกสนาม + อาคาร ── */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">เลือกสนามและอาคาร</p>
          <div className="flex flex-wrap gap-4 items-end">

            {/* สนาม */}
            <div className="flex flex-col gap-1 min-w-[220px]">
              <label className="text-xs text-gray-500">สนาม</label>
              <select
                value={selectedStadiumId}
                onChange={e => setSelectedStadiumId(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingStadiums}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              >
                <option value="">
                  {loadingStadiums ? "กำลังโหลด..." : "— เลือกสนาม —"}
                </option>
                {stadiums
                  .filter(s => s.statusStadium !== "inactive")
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nameStadium}
                      {s.statusStadium === "IsBooking" ? " (กำลังใช้งาน)" : ""}
                    </option>
                  ))}
              </select>
            </div>

            {/* อาคาร */}
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label className="text-xs text-gray-500">อาคาร</label>
              <select
                value={selectedBuildingId}
                onChange={e => setSelectedBuildingId(e.target.value ? Number(e.target.value) : "")}
                disabled={!selectedStadiumId || buildings.length === 0}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              >
                <option value="">
                  {!selectedStadiumId
                    ? "— เลือกสนามก่อน —"
                    : buildings.length === 0
                    ? "ไม่มีอาคารในสนามนี้"
                    : "— เลือกอาคาร —"}
                </option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Summary badge */}
            {selectedStadium && selectedBuildingId && (
              <div className="self-end pb-1 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                ✅ {selectedStadium.nameStadium} / {buildings.find(b => b.id === selectedBuildingId)?.name}
              </div>
            )}
          </div>
        </div>

        {/* ── เพิ่มรายวิชา ── */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold text-blue-700 text-sm mb-3 pb-2 border-b border-gray-100">
            เพิ่มรายวิชา — ปีการศึกษา {selectedYear} ภาค {selectedTerm}
          </h2>

          <div className="flex flex-wrap gap-3 items-end">

            <div className="flex flex-col gap-1 min-w-[120px]">
              <label className="text-xs text-gray-500">วัน (ทำซ้ำทุกสัปดาห์)</label>
              <select
                value={form.dayRow}
                onChange={e => updateForm("dayRow", Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {DAYS.map(d => <option key={d.row} value={d.row}>{d.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs text-gray-500">เวลาเริ่ม</label>
              <select
                value={form.startHour}
                onChange={e => updateForm("startHour", Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {START_OPTIONS.map(h => <option key={h} value={h}>{`${h}:00`}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs text-gray-500">เวลาจบ</label>
              <select
                value={form.endHour}
                onChange={e => updateForm("endHour", Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {END_OPTIONS.map(h => <option key={h} value={h}>{`${h}:00`}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs text-gray-500">รหัสวิชา</label>
              <input
                type="text"
                value={form.subject}
                placeholder="เช่น 060443303 (1)"
                onChange={e => updateForm("subject", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs text-gray-500">รหัสห้อง</label>
              <input
                type="text"
                value={form.room}
                placeholder="เช่น B3-08"
                onChange={e => updateForm("room", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">สีกล่อง</label>
              <div className="flex gap-1 items-center">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateForm("color", c)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? "#333" : "transparent",
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={e => updateForm("color", e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-gray-300"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              + เพิ่มลงตาราง
            </button>
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          {/* รายการรอบันทึก */}
          {blocks.length > 0 && (
            <div className="mt-3 border border-dashed border-blue-200 rounded-lg p-3 bg-blue-50">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                รายวิชาที่รอบันทึก ({blocks.length} วิชา → {expandedCount} booking ตลอดภาค)
              </p>
              <div className="flex flex-col gap-1">
                {blocks.map(b => {
                  const day = DAYS.find(d => d.row === b.dayRow);
                  const cnt = getDatesInRange(rangeStart, rangeEnd, ROW_TO_DOW[b.dayRow]).length;
                  return (
                    <div key={b.id} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                      <span className="font-medium">{b.subject}</span>
                      <span className="text-gray-400">
                        {day?.label} {b.startHour}:00–{b.endHour}:00
                        {b.room && ` · ${b.room}`}
                        {" · "}{cnt} ครั้ง
                      </span>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="ml-auto text-red-400 hover:text-red-600 font-bold leading-none"
                      >×</button>
                    </div>
                  );
                })}
              </div>

              {/* warning ถ้ายังไม่เลือกสนาม/อาคาร */}
              {(!selectedStadiumId || !selectedBuildingId) && (
                <p className="mt-2 text-xs text-orange-600">
                  ⚠️ กรุณาเลือกสนามและอาคารก่อนบันทึก
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !selectedStadiumId || !selectedBuildingId || !currentUser || !isStaff}
                className="mt-3 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : `บันทึกลงระบบ ${expandedCount} booking`}
              </button>
            </div>
          )}

          {saveResult && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              ✅ บันทึกสำเร็จ {saveResult.total} booking
              {saveResult.skipped.length > 0 && (
                <span className="text-orange-600">
                  {" "}· ข้าม {saveResult.skipped.length} วัน (ทับเวลา):{" "}
                  {saveResult.skipped.slice(0, 5).join(", ")}
                  {saveResult.skipped.length > 5 && " ..."}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-[#6c757d]" /> รอยืนยัน
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-[#28a745]" /> ยืนยันแล้ว
            </span>
          </div>
        </div>

        {/* ── Preview ตาราง ── */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500">ดูตารางสัปดาห์</p>
            <div className="flex items-center gap-2">
              {loadingSchedule && (
                <span className="text-xs text-blue-400 animate-pulse">กำลังโหลด...</span>
              )}
              <input
                type="date"
                value={previewWeek}
                onChange={e => setPreviewWeek(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {fetchError && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-xs text-red-600 mb-3">
              ⚠️ {fetchError}
            </div>
          )}

          <div className="overflow-x-auto">
            <TimetableGrid blocks={allBlocks} onDelete={handleDelete} loading={loadingSchedule} />
          </div>
        </div>

        <p className="text-[11px] text-gray-400">
          หมายเหตุ : รายวิชาที่เพิ่มจะถูกบันทึกทุกสัปดาห์ตามวันที่เลือก ตลอดช่วงวันเริ่มต้น–วันสิ้นสุดภาค
        </p>
      </div>
    </div>
  );
}

// ─── Timetable sub-component ─────────────────────────────────────────────────

function TimetableGrid({
  blocks,
  onDelete,
  loading = false,
}: {
  blocks: SubjectBlock[];
  onDelete: (id: number) => void;
  loading?: boolean;
}) {
  const COL_WIDTH  = 90;
  const ROW_HEIGHT = 72;
  const LABEL_W    = 120;
  const totalWidth = LABEL_W + HOURS.length * COL_WIDTH;

  return (
    <div style={{ minWidth: totalWidth }} className="relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
          <span className="text-xs text-blue-400 animate-pulse">กำลังโหลด...</span>
        </div>
      )}
      <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div
          className="shrink-0 border-r border-gray-200 flex items-center justify-center text-xs text-gray-400 font-medium"
          style={{ width: LABEL_W, height: 50 }}
        >
          วัน / เวลา
        </div>
        {HOURS.map(h => (
          <div
            key={h}
            className="shrink-0 border-r border-gray-100 last:border-r-0 flex items-center justify-center text-[11px] text-gray-500"
            style={{ width: COL_WIDTH, height: 50 }}
          >
            {`${h}:00–${h + 1}:00`}
          </div>
        ))}
      </div>

      {/* Empty state — แสดงตารางเปล่าพร้อมข้อความเมื่อไม่มีข้อมูล */}
      {!loading && blocks.length === 0 && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{ top: 50, bottom: 0, zIndex: 5 }}
        >
          <p className="text-sm text-gray-300 select-none">ยังไม่มีรายวิชาในสัปดาห์นี้</p>
        </div>
      )}
      {DAYS.map(day => {
        const dayBlocks = blocks.filter(b => b.dayRow === day.row);
        return (
          <div
            key={day.row}
            className="flex border-b border-gray-100 last:border-b-0"
            style={{ minHeight: ROW_HEIGHT }}
          >
            <div
              className="shrink-0 border-r border-gray-200 bg-gray-50 flex items-center px-3 text-sm font-semibold text-gray-700"
              style={{ width: LABEL_W, borderLeft: `4px solid ${day.accent}` }}
            >
              {day.label}
            </div>

            <div className="relative" style={{ width: HOURS.length * COL_WIDTH, minHeight: ROW_HEIGHT }}>
              {HOURS.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-gray-100"
                  style={{ left: i * COL_WIDTH, width: COL_WIDTH }}
                />
              ))}

              {dayBlocks.map(block => {
                const left  = (block.startHour - START_HOUR) * COL_WIDTH + 3;
                const width = (block.endHour - block.startHour) * COL_WIDTH - 6;
                return (
                  <div
                    key={block.id}
                    className="absolute top-2 bottom-2 rounded px-2 py-1 overflow-hidden group cursor-default"
                    style={{
                      left, width,
                      backgroundColor: block.color + "28",
                      border: `1px solid ${block.color}`,
                      borderLeft: `5px solid ${block.color}`,
                    }}
                  >
                    {!block.fromDB && (
                      <button
                        onClick={() => onDelete(block.id)}
                        className="absolute top-0.5 right-1.5 text-red-500 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                        title="ลบวิชานี้"
                      >×</button>
                    )}
                    {block.fromDB && (
                      <span
                        className="absolute top-0.5 right-1 text-[8px] px-1 py-0.5 rounded text-white leading-none"
                        style={{ backgroundColor: block.color }}
                      >
                        {block.dbStatus === "confirmed" ? "ยืนยันแล้ว" : "รอยืนยัน"}
                      </span>
                    )}
                    <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: block.color }}>
                      {block.subject}
                    </p>
                    {block.room && (
                      <p className="text-[10px] text-gray-500 truncate">{block.room}</p>
                    )}
                    <p className="text-[10px] text-gray-400">
                      {block.startHour}:00–{block.endHour}:00
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
