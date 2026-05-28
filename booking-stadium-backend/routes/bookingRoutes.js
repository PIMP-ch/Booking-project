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
  bookClassSchedule,
  getClassScheduleBookings,
  getBookingsByDate,
} from "../controllers/bookingController.js";

const router = express.Router();

// ─── ของเดิม (ไม่แตะ) ────────────────────────────────────────────────────────

router.post("/", bookStadium);

router.get("/user/:userId", getBookingByUser);
router.get("/", getAllBookings);

router.put("/:id/confirm", confirmBooking);

router.patch("/:id/cancel", cancelBooking);
router.put("/:id/cancel", cancelBooking);   // สำรองเผื่อหน้าเดิมยิง PUT

router.get("/available-dates", getAvailableDates);
router.put("/:id/reset", resetBookingStatus);

router.get("/stats/monthly", getMonthlyBookingStats);
router.get("/stats/daily", getDailyBookingStats);
router.get("/by-date", getBookingsByDate);

router.get("/history/returned", getReturnedBookings);
router.get("/bookings/user/:userId", getUserBookings);

// ─── ใหม่: ตารางเรียน ─────────────────────────────────────────────────────────

// POST /api/bookings/class-schedules  → บันทึกตารางเรียน
router.post("/class-schedules", bookClassSchedule);

// GET  /api/bookings/class-schedules  → ดึงตารางเรียน (filter ด้วย weekStart, year, term)
router.get("/class-schedules", getClassScheduleBookings);

export default router;