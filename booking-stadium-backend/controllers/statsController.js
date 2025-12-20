import User from "../models/User.js";
import Booking from "../models/Booking.js";

// ✅ API: จำนวนคน Register ทั้งหมด
export const getTotalRegisteredUsers = async (req, res) => {
    try {
        const userCount = await User.countDocuments(); // นับจำนวนผู้ใช้ทั้งหมด
        res.status(200).json({ totalUsers: userCount });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user count", error });
    }
};

// ✅ API: จำนวนยอดจองที่ยังไม่ยืนยัน
export const getPendingBookings = async (req, res) => {
    try {
        const pendingCount = await Booking.countDocuments({ status: "pending" }); // นับจำนวนการจองที่ status = pending
        res.status(200).json({ pendingBookings: pendingCount });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pending bookings count", error });
    }
};
