import express from "express";
import {
  bookStadium,
  getReturnedBookings,
  confirmBooking,
  resetBookingStatus,
  getMonthlyBookingStats,
  getAvailableDates,
  getBookingByUser,
  getAllBookings,
  cancelBooking,
  getDailyBookingStats,
  getUserBookings,
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", bookStadium);

// ✅ ดูประวัติการจองของแต่ละ User
router.get("/user/:userId", getBookingByUser);

// ✅ ดูประวัติการจองของ User ทั้งหมด
router.get("/", getAllBookings);

// ✅ เพิ่มการยืนยันการจอง
router.put("/:id/confirm", confirmBooking);

// ✅ ยกเลิกการจอง (แก้ path ให้ถูกต้อง)
router.patch("/:id/cancel", cancelBooking);
// (สำรอง) เผื่อหน้าเดิมยังยิง PUT อยู่
router.put("/:id/cancel", cancelBooking);

// ✅ Route สำหรับดึงวันที่ว่างและวันที่ติดจอง
router.get("/available-dates", getAvailableDates);

router.put("/:id/reset", resetBookingStatus); // เส้นทางสำหรับ Reset Booking

// Endpoint to get monthly booking statistics
router.get("/stats/monthly", getMonthlyBookingStats);

// ✅ เพิ่ม Route ใหม่สำหรับดึงสถิติรายวัน
router.get("/stats/daily", getDailyBookingStats);

// ✅ เพิ่มเส้นทางดึงประวัติการจองที่คืนสำเร็จแล้ว
router.get("/history/returned", getReturnedBookings);

// (ถ้าไม่ได้ใช้จริง แนะนำลบได้ แต่ไม่จำเป็น)
router.get("/bookings/user/:userId", getUserBookings);

export default router;
