"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAvailableDates, getStadiumBookings, getStadiumById } from "@/utils/api";
import { toast } from "react-toastify";
import {
  CircleChevronLeft,
  CircleChevronRight,
  ArrowLeft,
  Building2,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/th";

dayjs.locale("th");
dayjs.extend(isBetween);

// ตัวเลือกอาคาร
type Building = {
  id: string;
  name: string;
};

type StadiumBooking = {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "canceled" | "Return Success";
  userId?: { fullname?: string };
};

const bookingStatusLabel: Record<StadiumBooking["status"], string> = {
  pending: "รอการยืนยัน",
  confirmed: "ยืนยันแล้ว",
  canceled: "ยกเลิกแล้ว",
  "Return Success": "คืนอุปกรณ์สำเร็จ",
};

const DEFAULT_START = "08:00";
const DEFAULT_END = "18:00";

type DayTime = { startTime: string; endTime: string };
type DayTimeMap = Record<string, DayTime>;

const SelectDatePage = () => (
  <Suspense fallback={<p className="text-center text-gray-500 py-10">กำลังโหลด...</p>}>
    <SelectDate />
  </Suspense>
);

const SelectDate = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const stadiumId = searchParams?.get("stadiumId") ?? "";
  const stadiumName = searchParams?.get("stadiumName") ?? "ไม่พบชื่อสนาม";
  const userId = searchParams?.get("userId") ?? "";
  const stadiumImage = searchParams?.get("stadiumImage") ?? "";

  // state
  const [building, setBuilding] = useState<string>("");
  const [buildingName, setBuildingName] = useState<string>(""); // ✅ เพิ่มแค่ตัวนี้ (ไม่กระทบ UI)
  const [availableBuildings, setAvailbleBuildings] = useState<Building[]>([]);
  const [activityName, setActivityName] = useState<string>("");

  const [dateStatusList, setDateStatusList] = useState<{ date: string; status: string }[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  const [dayTimes, setDayTimes] = useState<DayTimeMap>({});
  const [isTimeActive, setIsTimeActive] = useState(false);

  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [currentMonth, setCurrentMonth] = useState(dayjs().month() + 1);
  const [stadiumBookings, setStadiumBookings] = useState<StadiumBooking[]>([]);
  const [bookingInfoLoading, setBookingInfoLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!stadiumId.trim()) return;
    (async () => {
      try {
        const data = await getAvailableDates(stadiumId, currentYear, currentMonth);
        const normalized =
          Array.isArray((data as any)?.dates)
            ? (data as any).dates
            : Array.isArray((data as any)?.availableDates)
              ? (data as any).availableDates
              : [];
        setDateStatusList(
          normalized
            .filter((x: any) => x && x.date)
            .map((x: any) => ({
              date: dayjs(x.date).format("YYYY-MM-DD"),
              status: x.status === "ไม่ว่าง" ? "ไม่ว่าง" : "ว่าง",
            }))
        );
      } catch (error) {
        console.error("❌ Error fetching dates:", error);
        setDateStatusList([]);
      }
    })();
  }, [stadiumId, currentYear, currentMonth]);

  useEffect(() => {
    if (!stadiumId.trim()) {
      setStadiumBookings([]);
      setBookingInfoLoading(false);
      return;
    }
    (async () => {
      try {
        setBookingInfoLoading(true);
        const bookings = await getStadiumBookings(stadiumId);
        setStadiumBookings(Array.isArray(bookings) ? bookings : []);
      } catch (error) {
        console.error("❌ Error fetching stadium bookings:", error);
        setStadiumBookings([]);
      } finally {
        setBookingInfoLoading(false);
      }
    })();
  }, [stadiumId]);

  // โหลดอาคารที่เปิดใช้งานตามสนามที่เลือก
  useEffect(() => {
    if (!stadiumId?.trim()) return;

    const fetchBuildingsByStadium = async () => {
      try {
        const stadium = await getStadiumById(stadiumId);

        setAvailbleBuildings(
          Array.isArray(stadium?.buildings) ? stadium.buildings : []
        );
      } catch (err) {
        console.error("❌ โหลดอาคารไม่สำเร็จ", err);
        setAvailbleBuildings([]);
      }
    };

    setBuilding("");
    setBuildingName("");
    fetchBuildingsByStadium();
  }, [stadiumId]);

  const statusMap = useMemo(() => {
    const m = new Map<string, "ว่าง" | "ไม่ว่าง">();
    dateStatusList.forEach((d) => m.set(d.date, d.status as "ว่าง" | "ไม่ว่าง"));
    return m;
  }, [dateStatusList]);

  const monthStart = useMemo(
    () => dayjs(`${currentYear}-${String(currentMonth).padStart(2, "0")}-01`),
    [currentYear, currentMonth]
  );
  const monthEnd = useMemo(() => monthStart.endOf("month"), [monthStart]);
  const daysInMonth = monthEnd.date();
  const firstDayIndex = monthStart.day();
  const todayStr = dayjs().format("YYYY-MM-DD");

  const monthDates = useMemo(() => {
    const arr: string[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(monthStart.date(i).format("YYYY-MM-DD"));
    }
    return arr;
  }, [daysInMonth, monthStart]);

  const selectedDates = useMemo(() => {
    if (!selectedStartDate) return [];
    if (!selectedEndDate) return [selectedStartDate];
    const start = dayjs(selectedStartDate);
    const end = dayjs(selectedEndDate);
    const result: string[] = [];
    let cursor = start.clone();
    while (cursor.isBefore(end, "day") || cursor.isSame(end, "day")) {
      result.push(cursor.format("YYYY-MM-DD"));
      cursor = cursor.add(1, "day");
    }
    return result;
  }, [selectedStartDate, selectedEndDate]);

  useEffect(() => {
    if (!selectedDates.length) {
      setDayTimes({});
      return;
    }
    setDayTimes((prev) => {
      const next: DayTimeMap = { ...prev };
      for (const d of selectedDates) {
        if (!next[d]) next[d] = { startTime: DEFAULT_START, endTime: DEFAULT_END };
      }
      Object.keys(next).forEach((k) => {
        if (!selectedDates.includes(k)) delete next[k];
      });
      return next;
    });
  }, [selectedDates]);

  const bookingsBySelectedDate = useMemo(() => {
    return selectedDates.map((date) => {
      const bookings = stadiumBookings.filter((booking) => {
        if (!booking?.startDate || !booking?.endDate) return false;
        if (booking.status === "canceled") return false;
        const start = dayjs(booking.startDate).startOf("day");
        const end = dayjs(booking.endDate).startOf("day");
        const target = dayjs(date).startOf("day");
        return target.isBetween(start, end, "day", "[]");
      });
      return { date, bookings };
    });
  }, [selectedDates, stadiumBookings]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  const handleDateSelect = (date: string, status: string) => {
    if (status !== "ว่าง") {
      toast.error("⛔ กรุณาเลือกวันที่ว่างเท่านั้น");
      return;
    }
    if (dayjs(date).isBefore(dayjs(todayStr), "day")) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setIsTimeActive(true);
      return;
    }

    if (dayjs(date).isBefore(dayjs(selectedStartDate))) {
      setSelectedEndDate(selectedStartDate);
      setSelectedStartDate(date);
    } else {
      setSelectedEndDate(date);
    }
  };

  const isSelected = (date: string) =>
    date === selectedStartDate ||
    date === selectedEndDate ||
    (selectedStartDate &&
      selectedEndDate &&
      dayjs(date).isBetween(selectedStartDate, selectedEndDate, null, "[]"));

  const setStartTimeForDay = (dateKey: string, startTime: string) => {
    setDayTimes((prev) => ({
      ...prev,
      [dateKey]: { ...(prev[dateKey] || { startTime: DEFAULT_START, endTime: DEFAULT_END }), startTime },
    }));
  };

  const setEndTimeForDay = (dateKey: string, endTime: string) => {
    setDayTimes((prev) => ({
      ...prev,
      [dateKey]: { ...(prev[dateKey] || { startTime: DEFAULT_START, endTime: DEFAULT_END }), endTime },
    }));
  };

  const handleGoToEquipment = () => {
    if (!building) {
      toast.error("⛔ กรุณาเลือกอาคารที่ต้องการเข้าใช้งาน");
      return;
    }

    if (!activityName.trim()) {
      toast.error("⛔ กรุณากรอกชื่อกิจกรรมที่ใช้งาน");
      return;
    }

    if (!selectedStartDate) {
      toast.error("กรุณาเลือกวันที่");
      return;
    }
    if (!userId) {
      toast.error("⛔ ต้องเข้าสู่ระบบก่อนจอง");
      return;
    }

    for (const d of selectedDates) {
      const t = dayTimes[d];
      const s = t?.startTime ?? DEFAULT_START;
      const e = t?.endTime ?? DEFAULT_END;
      if (s >= e) {
        toast.error(`⛔ เวลาไม่ถูกต้องในวันที่ ${dayjs(d).format("DD MMMM YYYY")} (สิ้นสุดต้องมากกว่าเริ่มต้น)`);
        return;
      }
    }

    const sportTypeId = searchParams?.get("sportTypeId");
    const end = selectedEndDate ?? selectedStartDate;
    const firstDay = selectedDates[0];
    const firstTimes = dayTimes[firstDay] || { startTime: DEFAULT_START, endTime: DEFAULT_END };

    const params = new URLSearchParams({
      stadiumId,
      stadiumName,
      building,       // id
      buildingName,   // ✅ ส่งชื่ออาคารไปด้วย (ไม่กระทบ UI)
      activityName: activityName.trim(),
      userId,
      startDate: selectedStartDate,
      endDate: end,
      startTime: firstTimes.startTime,
      endTime: firstTimes.endTime,
      dayTimes: JSON.stringify(dayTimes),
      sportTypeId: sportTypeId || "",
    });

    router.push(`/booking/selectEquipment?${params.toString()}`);
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      let m = direction === "prev" ? prev - 1 : prev + 1;
      if (m < 1) {
        setCurrentYear((y) => y - 1);
        m = 12;
      }
      if (m > 12) {
        setCurrentYear((y) => y + 1);
        m = 1;
      }
      return m;
    });
  };

  const isMultiDay = selectedDates.length > 1;

  return (
    <div className="relative min-h-screen font-kanit">
      <div className="absolute inset-0">
        <Image
          src={stadiumImage || "/images/stadium-placeholder.jpg"}
          alt={stadiumName}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" aria-hidden="true" />
      </div>

      <div className="relative z-10 p-4 max-w-[670px] mx-auto pb-20">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-orange-400 font-semibold mb-6 hover:text-orange-300 transition-colors"
        >
          <ArrowLeft size={20} />
          ย้อนกลับ
        </button>

        <h1 className="text-3xl font-bold text-center mb-6 text-white drop-shadow-lg">
          📅 รายละเอียดการจอง
        </h1>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl mb-4 border border-white/20 shadow-2xl">
          <label className="block text-white font-medium mb-3">
            ชื่อสนามที่เลือก
          </label>
          <input
            value={stadiumName}
            readOnly
            className="w-full p-3.5 rounded-xl bg-white text-gray-800 font-semibold"
          />
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl mb-4 border border-white/20 shadow-2xl">
          <label className="flex items-center gap-2 text-white font-medium mb-3">
            <Building2 size={20} className="text-orange-400" />
            สถานที่ / อาคาร
          </label>

          <select
            value={building}
            onChange={(e) => {
              const selectedId = e.target.value;
              setBuilding(selectedId);

              const selectedBuilding = availableBuildings.find((b) => b.id === selectedId);
              setBuildingName(selectedBuilding?.name || "");
            }}
            className="w-full p-3.5 rounded-xl bg-white text-gray-800 font-semibold focus:ring-4 focus:ring-orange-500/50 outline-none transition-all shadow-inner"
          >
            <option value="" disabled>
              กรุณาเลือกอาคารที่ต้องการเข้าใช้งาน...
            </option>

            {availableBuildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl mb-6 border border-white/20 shadow-2xl">
          <label className="block text-white font-medium mb-3">ชื่อกิจกรรมที่ใช้งาน</label>
          <input
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="เช่น แข่งขันแบดมินตัน"
            className="w-full p-3.5 rounded-xl bg-white text-gray-800 font-semibold focus:ring-4 focus:ring-orange-500/50 outline-none transition-all shadow-inner"
          />
        </div>

        <div className="bg-white/90 rounded-3xl p-5 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => handleMonthChange("prev")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <CircleChevronLeft size={28} className="text-orange-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={20} className="text-orange-600" />
              {monthStart.format("MMMM YYYY")}
            </h2>
            <button
              onClick={() => handleMonthChange("next")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <CircleChevronRight size={28} className="text-orange-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
              <div key={d} className="text-gray-400 text-xs font-bold pb-2">
                {d}
              </div>
            ))}

            {Array.from({ length: firstDayIndex }, (_, i) => (
              <div key={`empty-${i}`} className="h-10"></div>
            ))}

            {monthDates.map((d) => {
              const status = statusMap.get(d) ?? "ว่าง";
              const isPast = dayjs(d).isBefore(dayjs(todayStr), "day");
              const disabled = status !== "ว่าง" || isPast;
              const active = isSelected(d);

              return (
                <button
                  key={d}
                  onClick={() => handleDateSelect(d, status)}
                  disabled={disabled}
                  className={`relative h-14 flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all
                  ${active
                      ? "bg-orange-600 text-white shadow-lg scale-105 z-10"
                      : disabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                        : "bg-orange-50 text-orange-700 hover:bg-orange-100 hover:scale-105"
                    }`}
                >
                  <span>{dayjs(d).date()}</span>
                  <span className={`text-[9px] mt-0.5 ${active ? "text-orange-100" : "text-gray-500"}`}>
                    {isPast ? "ปิด" : status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDates.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🕒 ช่วงเวลาเข้าใช้งาน {isMultiDay && "(แยกตามวัน)"}
            </h2>

            {selectedDates
              .slice()
              .sort()
              .map((d) => {
                const t = dayTimes[d] || { startTime: DEFAULT_START, endTime: DEFAULT_END };
                return (
                  <div
                    key={d}
                    className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <div className="text-orange-300 font-bold mb-3 border-b border-white/10 pb-2">
                      {dayjs(d).format("DD MMMM YYYY")}
                    </div>

                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-300 mb-1">เวลาเริ่ม</label>
                        <input
                          type="time"
                          value={t.startTime}
                          onChange={(e) => setStartTimeForDay(d, e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white border-none text-gray-800 font-semibold"
                          disabled={!isTimeActive}
                        />
                      </div>
                      <div className="text-white pt-5">ถึง</div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-300 mb-1">เวลาสิ้นสุด</label>
                        <input
                          type="time"
                          value={t.endTime}
                          onChange={(e) => setEndTimeForDay(d, e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white border-none text-gray-800 font-semibold"
                          disabled={!isTimeActive}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 text-white">📌 ตรวจสอบคิวจองในวันที่เลือก</h2>
          {!selectedDates.length && (
            <div className="bg-white/5 p-8 rounded-2xl text-center text-gray-400 border border-dashed border-white/20">
              กรุณาเลือกวันที่บนปฏิทินเพื่อดูข้อมูลการจอง
            </div>
          )}

          {selectedDates.length > 0 && bookingInfoLoading && (
            <div className="text-center p-10 text-orange-300 animate-pulse">กำลังโหลดข้อมูล...</div>
          )}

          {selectedDates.length > 0 && !bookingInfoLoading && (
            <div className="space-y-6">
              {bookingsBySelectedDate.map(({ date, bookings }) => (
                <div key={date} className="bg-black/20 rounded-2xl p-4">
                  <h3 className="text-orange-200 font-bold flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    {dayjs(date).format("DD MMM YYYY")}
                  </h3>

                  {bookings.length === 0 ? (
                    <p className="text-gray-400 text-sm italic pl-4">ยังไม่มีคิวการจองในวันนี้</p>
                  ) : (
                    <div className="grid gap-3">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-white rounded-xl p-3 shadow-sm flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-gray-800">
                              🕒 {booking.startTime} - {booking.endTime}
                            </p>
                            <p className="text-xs text-gray-500">
                              ผู้จอง: {booking.userId?.fullname || "ไม่ระบุ"}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold ${booking.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                              }`}
                          >
                            {bookingStatusLabel[booking.status] || booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleGoToEquipment}
          className="w-full mt-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-2xl text-xl font-bold shadow-xl transform active:scale-95 transition-all"
        >
          ยืนยันและเลือกอุปกรณ์
        </button>
      </div>
    </div>
  );
};

export default SelectDatePage;
