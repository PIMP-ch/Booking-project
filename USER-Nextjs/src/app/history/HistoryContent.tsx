"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserBookings, cancelBooking } from "@/utils/api";
import { toast } from "react-toastify";
import { AlertCircle, Calendar, Package } from "lucide-react";
import dayjs from "dayjs";

interface Booking {
  _id: string;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "canceled" | "Return Success";
  stadiumId: { nameStadium: string };
  equipment: { equipmentId: { name: string }; quantity: number }[];
}

const HistoryContent = () => {
  return (
    <Suspense fallback={<p className="text-center text-gray-500">กำลังโหลด...</p>}>
      <BookingHistory />
    </Suspense>
  );
};

const BookingHistory = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "cancelled">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?._id) {
        setUserId(user._id);
      } else {
        toast.error("⛔ กรุณาเข้าสู่ระบบ");
        router.push("/user/login");
      }
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data: Booking[] = await getUserBookings(userId);
        setBookings(data);
      } catch (error) {
        // toast.error("🚫 โหลดข้อมูลการจองไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      await cancelBooking(selectedBooking);
      toast.success("✅ ยกเลิกการจองสำเร็จ");
      setBookings((prev) =>
        prev.map((b) => (b._id === selectedBooking ? { ...b, status: "canceled" } : b))
      );
    } catch (error) {
      toast.error("❌ ยกเลิกการจองไม่สำเร็จ");
    } finally {
      setShowModal(false);
    }
  };

  const filteredBookings = activeTab === "cancelled"
    ? bookings.filter((b) => b.status === "canceled")
    : bookings.filter((b) => b.status !== "canceled");

  return (
    <div className="mt-20 mb-20  font-kanit max-w-[670px] mx-auto">
      <div className="flex justify-start gap-4 mb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-md font-semibold transition ${activeTab === "all" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-800"}`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setActiveTab("cancelled")}
          className={`px-4 py-2 rounded-lg text-md font-semibold transition ${activeTab === "cancelled" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-800"}`}
        >
          รายการยกเลิก
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 mt-4">⏳ กำลังโหลดข้อมูล...</p>}

      {!loading && filteredBookings.length === 0 && (
        <p className="text-center text-gray-500 mt-4">ไม่มีข้อมูลการจอง</p>
      )}

      {!loading && filteredBookings.map((booking) => (
        <div key={booking._id} className="bg-white p-4 rounded-lg shadow-md mb-4 border border-gray-300">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Calendar className="text-orange-500" size={20} />
            {dayjs(booking.startDate).format("DD/MM/YY")} - {dayjs(booking.endDate).format("DD/MM/YY")}
          </h2>
          <p className="text-gray-700">สนาม: {booking.stadiumId?.nameStadium || "ไม่พบข้อมูลสนาม"}</p>

          <p className={`text-md font-bold mt-2 ${booking.status === "canceled" ? "text-red-500" :
            booking.status === "pending" ? "text-yellow-500" :
              booking.status === "confirmed" ? "text-green-500" : "text-blue-500"
            }`}>
            {booking.status === "pending" && "⏳ รอการยืนยัน"}
            {booking.status === "confirmed" && "✅ จองสำเร็จ"}
            {booking.status === "Return Success" && "🔄 คืนอุปกรณ์สำเร็จ"}
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-md font-bold flex items-center gap-2">
                <Package className="text-orange-500" size={18} /> อุปกรณ์ที่ใช้
              </h3>
              {booking.equipment.length > 0 && (
                <span className="text-sm text-gray-500">
                  {booking.equipment.length} รายการ
                </span>
              )}
            </div>

            {booking.equipment.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {booking.equipment.map((item, index) => {
                  const name = item.equipmentId?.name || "ไม่พบข้อมูล";
                  const quantity = Number(item.quantity) || 0;
                  return (
                    <div
                      key={`${item.equipmentId?.name ?? "unknown"}-${index}`}
                      className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">{name}</span>
                        <span className="text-xs text-gray-600">จำนวน x{quantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">ไม่มีข้อมูลอุปกรณ์สำหรับการจองนี้</p>
            )}
          </div>

          {booking.status === "pending" && (
            <button
              onClick={() => {
                setSelectedBooking(booking._id);
                setShowModal(true);
              }}
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              ยกเลิกการจอง
            </button>
          )}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-lg text-center shadow-lg w-80">
            <AlertCircle className="text-red-500 mx-auto mb-3" size={48} />
            <h2 className="text-lg font-bold">ยกเลิกการจอง</h2>
            <p className="text-gray-600 mt-2">คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?</p>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition">
                ยกเลิก
              </button>
              <button onClick={handleCancelBooking} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryContent;
