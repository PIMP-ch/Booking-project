"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAvailableDates, getStadiumBookings } from "@/utils/api";
import { toast } from "react-toastify";
import { CircleChevronLeft, CircleChevronRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/th";

dayjs.locale("th");
dayjs.extend(isBetween);

type StadiumBooking = {
  _id: string;
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
  <Suspense fallback={<p className="text-center text-gray-500">กำลังโหลด...</p>}>
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

  const [dateStatusList, setDateStatusList] = useState<{ date: string; status: string }[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  // ✅ เวลาแยกตามวัน
  const [dayTimes, setDayTimes] = useState<DayTimeMap>({});
  const [isTimeActive, setIsTimeActive] = useState(false);

  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [currentMonth, setCurrentMonth] = useState(dayjs().month() + 1);
  const [stadiumBookings, setStadiumBookings] = useState<StadiumBooking[]>([]);
  const [bookingInfoLoading, setBookingInfoLoading] = useState<boolean>(false);

  // โหลดวันว่าง/ไม่ว่าง
  useEffect(() => {
    if (!stadiumId.trim()) return;
    (async () => {
      try {
        const data = await getAvailableDates(stadiumId, currentYear, currentMonth);
        const normalized =
          Array.isArray(data?.dates)
            ? data.dates
            : Array.isArray(data?.availableDates)
            ? data.availableDates
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

  // โหลดรายการจองในเดือนนั้นๆ
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

  // ✅ sync dayTimes ให้มีทุกวันที่เลือก
  useEffect(() => {
    if (!selectedDates.length) {
      setDayTimes({});
      return;
    }
    setDayTimes((prev) => {
      const next: DayTimeMap = { ...prev };

      // add missing
      for (const d of selectedDates) {
        if (!next[d]) next[d] = { startTime: DEFAULT_START, endTime: DEFAULT_END };
      }

      // remove dates not selected anymore
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

  // ไปหน้าเลือกอุปกรณ์
  const handleGoToEquipment = () => {
    if (!selectedStartDate) {
      toast.error("กรุณาเลือกวันที่");
      return;
    }
    if (!userId) {
      toast.error("⛔ ต้องเข้าสู่ระบบก่อนจอง");
      return;
    }

    // ✅ validate เวลาแยกตามวัน
    for (const d of selectedDates) {
      const t = dayTimes[d];
      const s = t?.startTime ?? DEFAULT_START;
      const e = t?.endTime ?? DEFAULT_END;
      if (s >= e) {
        toast.error(`⛔ เวลาไม่ถูกต้องในวันที่ ${dayjs(d).format("DD MMMM YYYY")} (สิ้นสุดต้องมากกว่าเริ่มต้น)`);
        return;
      }
    }

    const end = selectedEndDate ?? selectedStartDate;

    // ส่ง start/end ของ "วันแรก" ไว้เพื่อไม่ให้หน้าถัดไปพัง (ถ้าโค้ดยังใช้แบบเดิม)
    const firstDay = selectedDates[0];
    const firstTimes = dayTimes[firstDay] || { startTime: DEFAULT_START, endTime: DEFAULT_END };

    const params = new URLSearchParams({
      stadiumId,
      stadiumName,
      userId,
      startDate: selectedStartDate,
      endDate: end,
      startTime: firstTimes.startTime,
      endTime: firstTimes.endTime,
      dayTimes: encodeURIComponent(JSON.stringify(dayTimes)), // ✅ เพิ่มใหม่: เวลาแยกตามวัน
      ...(stadiumImage ? { stadiumImage } : {}),
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
      {/* 🔹 พื้นหลัง */}
      <div className="absolute inset-0">
        <Image
          src={stadiumImage || "/images/stadium-placeholder.jpg"}
          alt={stadiumName}
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
      </div>

      {/* 🔹 เนื้อหา */}
      <div className="relative z-10 p-3 max-w-[670px] mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-orange-400 font-semibold mb-4"
        >
          <ArrowLeft size={20} />
          ย้อนกลับ
        </button>

        <h1 className="text-2xl font-bold text-center mb-4 text-white">📅 เลือกวันที่</h1>

        {/* แถบเดือน/ปี */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => handleMonthChange("prev")} className="p-2 bg-white/80 rounded-lg">
            <CircleChevronLeft size={24} className="text-gray-800" />
          </button>
          <h2 className="text-lg font-semibold text-white drop-shadow">
            {monthStart.format("MMMM YYYY")}
          </h2>
          <button onClick={() => handleMonthChange("next")} className="p-2 bg-white/80 rounded-lg">
            <CircleChevronRight size={24} className="text-gray-800" />
          </button>
        </div>

        {/* ตารางวัน */}
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-gray-200">
              {d}
            </div>
          ))}

          {Array.from({ length: firstDayIndex }, (_, i) => (
            <div key={`empty-${i}`} className="text-gray-300">
              -
            </div>
          ))}

          {monthDates.map((d) => {
            const status = statusMap.get(d) ?? "ว่าง";
            const isPast = dayjs(d).isBefore(dayjs(todayStr), "day");
            const disabled = status !== "ว่าง" || isPast;

            return (
              <button
                key={d}
                onClick={() => handleDateSelect(d, status)}
                disabled={disabled}
                className={`p-2 rounded-sm text-center font-bold transition-all
                ${
                  isSelected(d)
                    ? "bg-orange-700 text-white"
                    : disabled
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-orange-400 text-white hover:bg-orange-500"
                }`}
                title={status}
              >
                {dayjs(d).date()}
                {!isPast && <span className="block text-xs mt-1">{status}</span>}
              </button>
            );
          })}
        </div>

        {/* ✅ เลือกเวลาแยกตามวัน */}
        {selectedDates.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-white">เลือกเวลา{isMultiDay ? "ในแต่ละวัน" : ""}</h2>

            {selectedDates
              .slice()
              .sort()
              .map((d) => {
                const t = dayTimes[d] || { startTime: DEFAULT_START, endTime: DEFAULT_END };
                return (
                  <div key={d} className="mt-3 bg-white/10 rounded-lg p-3">
                    <div className="text-orange-200 font-semibold mb-2">
                      {dayjs(d).format("DD MMMM YYYY")}
                    </div>

                    <div className="flex gap-3 items-center flex-wrap">
                      <label className="text-white font-semibold">เริ่ม</label>
                      <input
                        type="time"
                        value={t.startTime}
                        onChange={(e) => setStartTimeForDay(d, e.target.value)}
                        className="p-2 border rounded"
                        disabled={!isTimeActive}
                      />

                      <label className="text-white font-semibold">สิ้นสุด</label>
                      <input
                        type="time"
                        value={t.endTime}
                        onChange={(e) => setEndTimeForDay(d, e.target.value)}
                        className="p-2 border rounded"
                        disabled={!isTimeActive}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ข้อมูลการจองในช่วงที่เลือก */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3 text-white">ข้อมูลการจองของวันที่เลือก</h2>
          {!selectedDates.length && (
            <p className="text-gray-200">กรุณาเลือกวันที่เพื่อดูรายละเอียดการจอง</p>
          )}
          {selectedDates.length > 0 && bookingInfoLoading && (
            <p className="text-gray-200">กำลังโหลดข้อมูลการจอง...</p>
          )}
          {selectedDates.length > 0 &&
            !bookingInfoLoading &&
            bookingsBySelectedDate.map(({ date, bookings }) => {
              const t = dayTimes[date];
              return (
                <div key={date} className="mb-4">
                  <h3 className="text-lg font-semibold text-orange-200">
                    {dayjs(date).format("DD MMMM YYYY")}
                  </h3>

                  {/* ✅ แสดงเวลาที่เลือกของวันนั้น */}
                  <p className="text-gray-200 text-sm">
                    เวลาที่เลือก: {t?.startTime ?? "--:--"} - {t?.endTime ?? "--:--"}
                  </p>

                  {bookings.length === 0 ? (
                    <p className="text-gray-200">ยังไม่มีการจองสำหรับวันนี้</p>
                  ) : (
                    <div className="space-y-3 mt-2">
                      {bookings.map((booking) => (
                        <div
                          key={booking._id}
                          className="bg-white/90 border border-gray-200 rounded-lg p-3 shadow-sm"
                        >
                          <p className="font-semibold text-gray-800">
                            🕒 {booking.startTime} - {booking.endTime}
                          </p>
                          <p className="text-gray-600">
                            ผู้จอง: {booking.userId?.fullname || "ไม่ระบุ"}
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              booking.status === "confirmed"
                                ? "text-green-600"
                                : booking.status === "pending"
                                ? "text-yellow-600"
                                : booking.status === "canceled"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            สถานะ: {bookingStatusLabel[booking.status] || booking.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <button
          onClick={handleGoToEquipment}
          className="w-full mt-6 bg-orange-500 text-white py-3 rounded-lg text-lg font-bold"
        >
          เลือกอุปกรณ์
        </button>
      </div>
    </div>
  );
};

export default SelectDatePage;
