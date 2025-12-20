import Booking from "../models/Booking.js";
import Equipment from "../models/Equipment.js";
import Stadium from "../models/Stadium.js";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import 'dayjs/locale/th.js'
import { message } from "hawk/lib/client.js";

dayjs.extend(isBetween);
dayjs.locale('th');
dayjs.extend(utc);
dayjs.extend(timezone);
// ตั้งค่า default timezone เป็น Asia/Bangkok
dayjs.tz.setDefault("Asia/Bangkok");

// ✅ จองสนามและอุปกรณ์
export const bookStadium = async (req, res) => {
    try {
        const { userId, stadiumId, equipment = [], startDate, endDate } = req.body;

        console.log("📌 Received Request Data:", { userId, stadiumId, startDate, endDate, equipment });

        // ✅ ตรวจสอบว่า Stadium มีอยู่หรือไม่
        const stadium = await Stadium.findById(stadiumId);
        console.log("🏟️ Stadium Found:", stadium);

        if (!stadium) {
            return res.status(404).json({ message: "Stadium not found" });
        }

        // ✅ แปลงเวลาที่ใช้ในการ Query เป็น UTC
        const startUTC = new Date(startDate).toISOString();
        const endUTC = new Date(endDate).toISOString();

        console.log("🔍 Checking for overlapping bookings...");
        console.log("🔹 Start Date Query (UTC):", startUTC);
        console.log("🔹 End Date Query (UTC):", endUTC);

        // ✅ ตรวจสอบว่ามีการจองที่ทับซ้อนกันหรือไม่
        const overlappingBooking = await Booking.findOne({
            stadiumId,
            status: { $in: ["pending", "confirmed"] }, // ✅ กรองเฉพาะสถานะที่ยังใช้งาน
            $and: [
                { startDate: { $lt: endUTC } },
                { endDate: { $gte: startUTC } }
            ]
        });

        console.log("🔍 Found Overlapping Booking:", overlappingBooking);

        if (overlappingBooking) {
            return res.status(400).json({ message: "This stadium is already booked for the selected time." });
        }

        // ✅ ตรวจสอบวันที่ให้ถูกต้อง
        console.log("📅 Checking date validity...");
        console.log("🕒 Start Date:", new Date(startDate));
        console.log("🕒 End Date:", new Date(endDate));

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ message: "End date must be after start date" });
        }

        // ✅ ตรวจสอบอุปกรณ์ที่ไม่พอ
        if (equipment.length > 0) {
            console.log("🛠️ Checking equipment availability...");
            const unavailableEquipments = [];
            for (const item of equipment) {
                const dbEquipment = await Equipment.findById(item.equipmentId);
                console.log("📦 Equipment Found:", dbEquipment);

                if (!dbEquipment || dbEquipment.status !== "available" || dbEquipment.quantity < item.quantity) {
                    unavailableEquipments.push({
                        equipmentId: item.equipmentId,
                        message: "Not enough quantity or unavailable"
                    });
                }
            }

            if (unavailableEquipments.length > 0) {
                console.log("❌ Some equipment is unavailable:", unavailableEquipments);
                return res.status(400).json({
                    message: "Some equipment is unavailable",
                    unavailableEquipments
                });
            }

            // ✅ อัปเดตจำนวนอุปกรณ์
            console.log("🔄 Updating equipment quantity...");
            for (const item of equipment) {
                await Equipment.findByIdAndUpdate(item.equipmentId, {
                    $inc: { quantity: -item.quantity }
                });
            }
        }

        // ✅ บันทึกการจอง
        console.log("📝 Creating new booking...");
        const newBooking = new Booking({ userId, stadiumId, equipment, startDate: startUTC, endDate: endUTC, status: "pending" });
        await newBooking.save();
        console.log("✅ Booking Created:", newBooking);

        // ✅ ตรวจสอบจำนวนการจองทั้งหมด ถ้ามีการจองให้ตั้งค่า `IsBooking`
        console.log("📊 Checking active bookings for stadium...");
        const activeBookings = await Booking.find({ stadiumId, status: { $ne: "canceled" } });
        console.log("📊 Active Bookings Count:", activeBookings.length);

        stadium.statusStadium = activeBookings.length > 0 ? "IsBooking" : "Available";
        console.log("🏟️ Updating Stadium Status:", stadium.statusStadium);
        await stadium.save();

        // ✅ ดึงข้อมูลการจองพร้อมข้อมูลผู้ใช้
        console.log("📥 Populating booking data...");
        const populatedBooking = await Booking.findById(newBooking._id)
            .populate("userId", "fullname phoneNumber email fieldOfStudy year")
            .populate("stadiumId", "nameStadium descriptionStadium")
            .populate("equipment.equipmentId", "name quantity");

        console.log("✅ Booking Completed:", populatedBooking);

        res.status(201).json({
            message: "Stadium booked successfully",
            success: true,
            Booking: newBooking,
            populatedBooking
        });
    } catch (error) {
        console.error("🚨 Server Error:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

export const getUserBookings = async (req, res) => {
    try {
        const  { userId } = req.params;

        const bookings = await Booking.find({ userId })
            .populate("stadiumId", "nameStadium imageUrl descriptionStadium contactStadium");

        res.json(bookings);
    } catch (err) {
        console.error("getuserBookings error:", err);
        res.status(500).json({ message: "server error"});
    }
};


export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("stadiumId", "nameStadium descriptionStadium")
            .populate("equipment.equipmentId", "name quantity")
            .populate("userId", "fullname phoneNumber email fieldOfStudy year");

        if (bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found" });
        }

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching all bookings:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ฟังก์ชันดึงวันที่ว่างและติดจอง
export const getAvailableDates = async (req, res) => {
    try {
        const { stadiumId, year, month } = req.query;

        if (!stadiumId || !year || !month) {
            return res.status(400).json({ message: "stadiumId, year, and month จำเป็นต้องระบุ" });
        }

        const today = dayjs().format("YYYY-MM-DD"); // วันที่ปัจจุบัน
        const startOfMonth = dayjs(`${year}-${month}-01`).startOf("month");
        const endOfMonth = dayjs(`${year}-${month}-01`).endOf("month");

        const stadium = await Stadium.findById(stadiumId);
        if (!stadium) {
            return res.status(404).json({ message: "ไม่พบข้อมูลสนาม" });
        }

        // ✅ ถ้าสนามสถานะเป็น "active" ให้ทุกวันว่างหมด
        if (stadium.statusStadium === "active") {
            const totalDaysInMonth = endOfMonth.date();
            const availableDates = [];

            for (let day = 1; day <= totalDaysInMonth; day++) {
                const date = dayjs(`${year}-${month}-${day}`).format("YYYY-MM-DD");
                availableDates.push({
                    date,
                    status: dayjs(date).isBefore(today, "day") ? "ไม่ได้" : "ว่าง",
                });
            }

            return res.status(200).json({ availableDates, bookedDates: [] });
        }

        // ✅ ดึงรายการจองของเดือนนี้
        const bookings = await Booking.find({
            stadiumId,
            status: { $in: ["confirmed", "pending"] },
            $or: [
                { startDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() } },
                { endDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() } },
                {
                    $and: [
                        { startDate: { $lte: startOfMonth.toDate() } },
                        { endDate: { $gte: endOfMonth.toDate() } },
                    ],
                },
            ],
        });

        // ✅ เก็บวันที่จอง
        const bookedDates = new Set();

        bookings.forEach((booking) => {
            let currentDate = dayjs(booking.startDate);
            const endDate = dayjs(booking.endDate);

            while (currentDate.isBefore(endDate, "day") || currentDate.isSame(endDate, "day")) {
                if (currentDate.isBetween(startOfMonth, endOfMonth, "day", "[]")) {
                    bookedDates.add(currentDate.format("YYYY-MM-DD"));
                }
                currentDate = currentDate.add(1, "day");
            }
        });

        // ✅ วนลูปสร้างวันที่ทั้งหมดในเดือน
        const totalDaysInMonth = endOfMonth.date();
        const responseDates = [];

        for (let day = 1; day <= totalDaysInMonth; day++) {
            const date = dayjs(`${year}-${month}-${day}`).format("YYYY-MM-DD");

            if (bookedDates.has(date)) {
                responseDates.push({ date, status: "ไม่ว่าง" });
            } else if (dayjs(date).isBefore(today, "day")) {
                responseDates.push({ date, status: "ไม่ได้" });
            } else {
                responseDates.push({ date, status: "ว่าง" });
            }
        }

        res.status(200).json({ dates: responseDates });
    } catch (error) {
        console.error("❌ Error fetching available dates:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


export const getBookingByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const bookings = await Booking.find({ userId })
            .populate("stadiumId", "nameStadium descriptionStadium")
            .populate("equipment.equipmentId", "name quantity")
            .populate("userId", "fullname phoneNumber email fieldOfStudy year");

        if (bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for this user" });
        }

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


// ✅ ยืนยันการจอง
export const confirmBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        booking.status = "confirmed";
        await booking.save();

        res.status(200).json({ message: "Booking confirmed successfully", booking });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ยกเลิกการจอง พร้อมคืนค่าอุปกรณ์และรีเซ็ตสนาม
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate("equipment.equipmentId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === "canceled") {
            return res.status(400).json({ message: "Booking is already canceled" });
        }

        // ✅ 1. คืนค่าอุปกรณ์ที่ถูกใช้
        for (const item of booking.equipment) {
            const equipment = await Equipment.findById(item.equipmentId._id);
            if (equipment) {
                await Equipment.findByIdAndUpdate(item.equipmentId._id, {
                    status: "available",
                    $inc: { quantity: item.quantity }, // เพิ่มจำนวนอุปกรณ์กลับเข้าไป
                });
            }
        }

        // ✅ 2. เปลี่ยนสถานะสนามจาก "IsBooking" เป็น "active"
        const stadium = await Stadium.findById(booking.stadiumId);
        if (stadium && stadium.statusStadium === "IsBooking") {
            await Stadium.findByIdAndUpdate(booking.stadiumId, { statusStadium: "active" });
        }

        // ✅ 3. เปลี่ยนสถานะ Booking เป็น "canceled"
        booking.status = "canceled";
        await booking.save();

        res.status(200).json({
            message: "Booking canceled successfully, equipment and stadium reset",
            booking,
        });
    } catch (error) {
        console.error("Error canceling booking:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


// ✅ ดึงประวัติการจองที่มีสถานะ "Return Success"
export const getReturnedBookings = async (req, res) => {
    try {
        const returnedBookings = await Booking.find({ status: "Return Success" })
            .populate("userId", "fullname phoneNumber email fieldOfStudy year") // ดึงข้อมูลผู้ใช้
            .populate("stadiumId", "nameStadium descriptionStadium") // ดึงข้อมูลสนามกีฬา
            .populate("equipment.equipmentId", "name quantity"); // ดึงข้อมูลอุปกรณ์

        if (returnedBookings.length === 0) {
            return res.status(404).json({ message: "No returned bookings found" });
        }

        res.status(200).json(returnedBookings);
    } catch (error) {
        console.error("Error fetching returned bookings:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


// Controller to get booking statistics per month
export const getMonthlyBookingStats = async (req, res) => {
    try {
        // Aggregate data to calculate monthly booking counts
        const stats = await Booking.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$startDate" },
                        month: { $month: "$startDate" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }, // Sort by year and month
            },
            {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    count: 1,
                    _id: 0, // Exclude the default `_id`
                },
            },
        ]);

        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching monthly booking stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const resetBookingStatus = async (req, res) => {
    try {
        const { id } = req.params; // รับ ID ของ Booking จาก URL

        // ดึงข้อมูลการจอง
        const booking = await Booking.findById(id).populate("equipment.equipmentId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "confirmed") {
            return res.status(400).json({ message: "Only confirmed bookings can be reset" });
        }

        // Reset Stadium Status
        await Stadium.findByIdAndUpdate(booking.stadiumId, { statusStadium: "active" });

        // Reset Equipment Status
        for (const item of booking.equipment) {
            const equipment = await Equipment.findById(item.equipmentId._id);
            if (equipment) {
                await Equipment.findByIdAndUpdate(item.equipmentId._id, {
                    status: "available",
                    $inc: { quantity: item.quantity }, // คืนจำนวนอุปกรณ์ที่ถูกใช้
                });
            }
        }

        // อัปเดตสถานะ Booking
        booking.status = "Return Success";
        await booking.save();

        res.status(200).json({ message: "Booking and stadium reset successfully", booking });
    } catch (error) {
        console.error("Error resetting booking status:", error);
        res.status(500).json({ message: "Server error", error });
    }
};