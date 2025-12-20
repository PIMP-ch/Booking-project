import express from "express";
import { getTotalRegisteredUsers, getPendingBookings } from "../controllers/statsController.js";

const router = express.Router();

// ✅ Route สำหรับจำนวนคน Register ทั้งหมด
router.get("/users", getTotalRegisteredUsers);

// ✅ Route สำหรับจำนวนยอดจองที่ยังไม่ยืนยัน
router.get("/bookings/pending", getPendingBookings);

export default router;
