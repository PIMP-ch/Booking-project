// controllers/bookingController.js
import Booking from "../models/Booking.js";
import Equipment from "../models/Equipment.js";
import mongoose from "mongoose";
import Stadium from "../models/Stadium.js";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import "dayjs/locale/th.js";

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

// helper: รวมวัน+เวลาเป็น Date (เก็บเป็น Date ให้ตรง schema)
function toDateTime(dateLike, hhmm = "00:00") {
  const d = new Date(dateLike);
  const [hh = "00", mm = "00"] = (hhmm || "00:00").split(":");
  d.setHours(Number(hh), Number(mm), 0, 0);
  return d;
}

// helper: normalize อุปกรณ์ให้เป็นรูปแบบที่ backend ใช้จริง
function normalizeEquipment(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(Boolean)
    .map((it) => ({
      equipmentId: it?.equipmentId,
      quantity: Number(it?.quantity) || 0,
    }))
    .filter(
      (it) =>
        mongoose.Types.ObjectId.isValid(it.equipmentId) &&
        Number.isFinite(it.quantity) &&
        it.quantity > 0
    );
}

// =================== CREATE (กันทับเวลา) ===================
export const bookStadium = async (req, res) => {
  try {
    const { userId, stadiumId, activityName, startDate, endDate, startTime, endTime } = req.body;

    // รองรับ buildingIds / buildingId / building (บางหน้าส่งคนละชื่อ)
    const rawBuilding =
      req.body.buildingIds ?? req.body.buildingId ?? req.body.building ?? [];
    const normalizedBuildingIds = (Array.isArray(rawBuilding) ? rawBuilding : [rawBuilding])
      .filter(Boolean)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    // normalize equipment
    const normalizedEquipment = normalizeEquipment(req.body.equipment);

    // activityName ไม่บังคับ (ถ้าไม่ส่งมาใช้ default ตอน create)
    if (!userId || !stadiumId || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    if (normalizedBuildingIds.length === 0) {
      return res.status(400).json({ message: "กรุณาเลือกอาคารก่อนทำการจอง" });
    }


    if (startTime >= endTime) {
      return res.status(400).json({ message: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด" });
    }

    const newStart = toDateTime(startDate, startTime);
    const newEnd   = toDateTime(endDate,   endTime);
    if (!(newStart < newEnd)) {
      return res.status(400).json({ message: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด" });
    }

    const stadium = await Stadium.findById(stadiumId);
    if (!stadium) return res.status(404).json({ message: "Stadium not found" });

    // 🔒 กัน “จองทับ” : newStart < existEnd && newEnd > existStart
    const conflict = await Booking.findOne({
      stadiumId,
      status: { $in: ["pending", "confirmed"] },
      startDate: { $lt: newEnd },
      endDate:   { $gt: newStart },
    }).lean();

    if (conflict) {
      return res.status(409).json({ message: "ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น" });
    }

    // ตรวจอุปกรณ์
    if (normalizedEquipment.length > 0) {
      const unavailable = [];
      for (const item of normalizedEquipment) {
        const eq = await Equipment.findById(item.equipmentId);
        if (!eq || eq.status !== "available" || eq.quantity < item.quantity) {
          unavailable.push({ equipmentId: item.equipmentId, message: "Not enough quantity or unavailable" });
        }
      }
      if (unavailable.length) {
        return res.status(400).json({ message: "Some equipment is unavailable", unavailableEquipments: unavailable });
      }
      for (const item of normalizedEquipment) {
        await Equipment.findByIdAndUpdate(item.equipmentId, { $inc: { quantity: -item.quantity } });
      }
    }

    const booking = await Booking.create({
      userId,
      stadiumId,
      buildingIds: normalizedBuildingIds,
      // BookingSchema มี field `name` required:true
      name: activityName?.trim() || "การจองสนาม",
      activityName: activityName?.trim() || "",
      equipment: normalizedEquipment,
      startDate: newStart, // เก็บเป็น Date
      endDate: newEnd,     // เก็บเป็น Date
      startTime,
      endTime,
      status: "pending",
    });

    // อัปเดตสถานะสนาม (ตาม booking ที่ยัง active: pending/confirmed)
    const activeCount = await Booking.countDocuments({ stadiumId, status: { $in: ["pending", "confirmed"] } });
    stadium.statusStadium = activeCount > 0 ? "IsBooking" : "Available";
    await stadium.save();

    const populated = await Booking.findById(booking._id)
      .populate("userId", "fullname phoneNumber email fieldOfStudy year")
      .populate("stadiumId", "nameStadium descriptionStadium")
      .populate("buildingIds", "name")
      .populate("equipment.equipmentId", "name quantity");

    return res.status(201).json({ message: "Stadium booked successfully", success: true, booking, populatedBooking: populated });
  } catch (error) {
    console.error("Error booking stadium:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =================== READ: ปฏิทินวันว่าง (ทั้งเดือน) ===================
export const getAvailableDates = async (req, res) => {
  try {
    const { stadiumId, year, month } = req.query;
    if (!stadiumId || !year || !month) {
      return res.status(400).json({ message: "stadiumId, year, and month จำเป็นต้องระบุ" });
    }

    const today = dayjs().format("YYYY-MM-DD");
    const startOfMonth = dayjs(`${year}-${month}-01`).startOf("month");
    const endOfMonth   = dayjs(`${year}-${month}-01`).endOf("month");

    const stadium = await Stadium.findById(stadiumId);
    if (!stadium) return res.status(404).json({ message: "ไม่พบข้อมูลสนาม" });

    // ถ้าสนาม Available → ให้ทุกวันในอนาคตเป็น "ว่าง"
    if (stadium.statusStadium === "Available") {
      const totalDays = endOfMonth.date();
      const availableDates = [];
      for (let d = 1; d <= totalDays; d++) {
        const date = dayjs(`${year}-${month}-${String(d).padStart(2, "0")}`).format("YYYY-MM-DD");
        availableDates.push({ date, status: dayjs(date).isBefore(today, "day") ? "ไม่ได้" : "ว่าง" });
      }
      return res.status(200).json({ dates: availableDates });
    }

    // ดึง booking ที่คาบเกี่ยวเดือนนี้
    const bookings = await Booking.find({
      stadiumId,
      status: { $in: ["confirmed", "pending"] },
      $or: [
        { startDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() } },
        { endDate:   { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() } },
        { startDate: { $lte: startOfMonth.toDate() }, endDate: { $gte: endOfMonth.toDate() } },
      ],
    }).select("startDate endDate");

    const bookedSet = new Set();
    bookings.forEach((b) => {
      let cur = dayjs(b.startDate).startOf("day");
      const end = dayjs(b.endDate).startOf("day");
      while (cur.isBefore(end, "day") || cur.isSame(end, "day")) {
        if (cur.isBetween(startOfMonth, endOfMonth, "day", "[]")) {
          bookedSet.add(cur.format("YYYY-MM-DD"));
        }
        cur = cur.add(1, "day");
      }
    });

    const totalDays = endOfMonth.date();
    const response = [];
    for (let d = 1; d <= totalDays; d++) {
      const date = dayjs(`${year}-${month}-${String(d).padStart(2, "0")}`).format("YYYY-MM-DD");
      if (bookedSet.has(date)) response.push({ date, status: "ไม่ว่าง" });
      else if (dayjs(date).isBefore(today, "day")) response.push({ date, status: "ไม่ได้" });
      else response.push({ date, status: "ว่าง" });
    }

    return res.status(200).json({ dates: response });
  } catch (error) {
    console.error("Error getAvailableDates:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =================== READ: ประวัติของ user แบบ 1) /user/:userId ===================
export const getBookingByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ userId })
      .populate("stadiumId", "nameStadium descriptionStadium")
      .populate("buildingIds", "name")
      .populate("equipment.equipmentId", "name quantity")
      .populate("userId", "fullname phoneNumber email fieldOfStudy year");
    if (!bookings.length) return res.status(404).json({ message: "No bookings found for this user" });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =================== READ: ประวัติของ user แบบ 2) /bookings/user/:userId ===================
export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ userId })
      .populate("StadiumId", "nameStadium imageUrl descriptionStadium contactStadium")
      .populate("buildingIds", "name")
      .populate("equipment.equipmentId", "name quantity")
      .populate("userId", "fullname phoneNumber email fieldOfStudy year");    
      return res.json(bookings);
  } catch (err) {
    console.error("getUserBookings error:", err);
    return res.status(500).json({ message: "server error" });
  }
};

// =================== อื่น ๆ คงเดิม ===================
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("stadiumId", "nameStadium descriptionStadium")
      .populate("buildingIds", "name")
      .populate("equipment.equipmentId", "name quantity")
      .populate("userId", "fullname phoneNumber email fieldOfStudy year");
    if (!bookings.length) return res.status(404).json({ message: "No bookings found" });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    booking.status = "confirmed";
    await booking.save();
    return res.status(200).json({ message: "Booking confirmed successfully", booking });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  // log ให้รู้ว่าหน้าบ้านยิงมาถูกไหม
  console.log("CANCEL bookingId:", req.params.id);
  console.log("CANCEL body:", req.body);

  try {
    const { cancelReason } = req.body;
    const { id } = req.params;

    // กัน id ผิดรูป
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid booking id" });
    }

    // อ่าน booking มาก่อนเพื่อคืนอุปกรณ์ + ใช้ stadiumId
    const booking = await Booking.findById(id).populate("equipment.equipmentId");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // กันยกเลิกซ้ำ
    if (booking.status === "canceled") {
      return res.status(200).json({ message: "Booking is already canceled", booking });
    }

    // ✅ คืนอุปกรณ์แบบปลอดภัย (กัน equipmentId เป็น null/undefined)
    if (Array.isArray(booking.equipment) && booking.equipment.length > 0) {
      for (const item of booking.equipment) {
        const eqDoc = item?.equipmentId; // อาจเป็น object (populate) หรือ null
        const eqId = eqDoc && typeof eqDoc === "object" ? eqDoc._id : eqDoc;

        // ข้ามถ้าไม่มี id หรือไม่ valid
        if (!mongoose.Types.ObjectId.isValid(eqId)) continue;

        const qty = Number(item?.quantity) || 0;
        if (qty <= 0) continue;

        await Equipment.findByIdAndUpdate(eqId, {
          status: "available",
          $inc: { quantity: qty },
        });
      }
    }

    // ✅ ยกเลิกแบบไม่ validate (กันเคส booking เก่าที่ equipmentId ว่าง ทำให้ save ไม่ผ่าน)
    // และไม่แตะ buildingIds/stadiumId เลย (ไม่กระทบชื่ออาคารหน้า admin)
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: { status: "canceled", cancelReason: cancelReason || "" } },
      { new: true, runValidators: false }
    );

    // ✅ อัปเดตสถานะสนามตาม booking ที่ยัง active (pending/confirmed)
    const activeCount = await Booking.countDocuments({
      stadiumId: booking.stadiumId,
      status: { $in: ["pending", "confirmed"] },
    });

    await Stadium.findByIdAndUpdate(booking.stadiumId, {
      statusStadium: activeCount > 0 ? "IsBooking" : "Available",
    });

    return res.status(200).json({
      message: "Booking canceled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("=== Error canceling booking ===");
    console.error("name:", error?.name);
    console.error("message:", error?.message);
    console.error("stack:", error?.stack);

    if (error?.errors) console.error("mongoose errors:", error.errors);
    if (error?.code) console.error("mongo code:", error.code);

    return res.status(500).json({
      message: "Server error",
      error: error?.message || "unknown",
    });
  }
};




export const getReturnedBookings = async (req, res) => {
  try {
    const returned = await Booking.find({ status: "Return Success" })
      .populate("userId", "fullname phoneNumber email fieldOfStudy year")
      .populate("stadiumId", "nameStadium descriptionStadium")
      .populate("buildingIds", "name")
      .populate("equipment.equipmentId", "name quantity");
    if (!returned.length) return res.status(404).json({ message: "No returned bookings found" });
    return res.status(200).json(returned);
  } catch (error) {
    console.error("Error fetching returned bookings:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMonthlyBookingStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $group: { _id: { year: { $year: "$startDate" }, month: { $month: "$startDate" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $project: { year: "$_id.year", month: "$_id.month", count: 1, _id: 0 } },
    ]);
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching monthly booking stats:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("equipment.equipmentId");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "confirmed") return res.status(400).json({ message: "Only confirmed bookings can be reset" });

    for (const item of booking.equipment) {
      await Equipment.findByIdAndUpdate(item.equipmentId._id, { status: "available", $inc: { quantity: item.quantity } });
    }
    booking.status = "Return Success";
    await booking.save();

    // อัปเดตสถานะสนามตาม booking ที่ยัง active (pending/confirmed)
    const activeCount = await Booking.countDocuments({
      stadiumId: booking.stadiumId,
      status: { $in: ["pending", "confirmed"] },
    });
    await Stadium.findByIdAndUpdate(booking.stadiumId, {
      statusStadium: activeCount > 0 ? "IsBooking" : "Available",
    });

    return res.status(200).json({ message: "Booking and stadium reset successfully", booking });
  } catch (error) {
    console.error("Error resetting booking status:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getDailyBookingStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "Month and year are required." });

    const daily = await Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) } } },
      { $group: { _id: { $dayOfMonth: "$createdAt" }, count: { $sum: 1 } } },
      { $project: { _id: 0, day: "$_id", count: 1 } },
      { $sort: { day: 1 } },
    ]);
    return res.status(200).json(daily);
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return res.status(500).json({ message: "Failed to fetch daily booking stats" });
  }
};
