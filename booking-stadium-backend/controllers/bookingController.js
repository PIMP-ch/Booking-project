// controllers/bookingController.js
import Booking from "../models/Bookingg.js";
import Equipment from "../models/Equipmentt.js";
import mongoose from "mongoose";
import Stadium from "../models/Stadiumm.js";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import "dayjs/locale/th.js";
import { fn, col, literal, Op } from "sequelize";
import Userr from "../models/Userr.js";
import Building from "../models/Buildingg.js";
import BookingEquipment from "../models/BookingEquipment.js";
import multer from "multer";
import path from "path";
import fs from "fs";

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads/files");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `booking_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function toDateTime(dateLike, hhmm = "00:00") {
  const dateStr = dayjs(dateLike).format("YYYY-MM-DD");
  return dayjs.tz(`${dateStr} ${hhmm || "00:00"}`, "Asia/Bangkok").toDate();
}

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
        Number.isInteger(Number(it.equipmentId)) &&
        Number(it.equipmentId) > 0 &&
        Number.isFinite(it.quantity) &&
        it.quantity > 0
    );
}

// =================== CREATE (กันทับเวลา) ===================
export const bookStadium = async (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const parseJSON = (value, defaultValue = null) => {
        if (!value) return defaultValue;
        if (typeof value === "string") {
          try { return JSON.parse(value); } catch { return defaultValue; }
        }
        return value;
      };

      const toArray = (value) => {
        const parsed = parseJSON(value, value);
        if (!parsed) return [];
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      };

      const { userId, stadiumId, activityName, startDate, endDate, startTime, endTime } = req.body;

      const filePath = req.file ? `/uploads/files/${req.file.filename}` : null;
      const rawBuilding = req.body.buildingIds ?? req.body.buildingId ?? req.body.building;
      const normalizedBuildingIds = toArray(rawBuilding).map(Number).filter((id) => Number.isInteger(id));
      const rawEquipment = parseJSON(req.body.equipment, []);
      const normalizedEquipment = normalizeEquipment(rawEquipment);

      if (!userId || !stadiumId || !startDate || !endDate || !startTime || !endTime)
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      if (normalizedBuildingIds.length === 0)
        return res.status(400).json({ message: "กรุณาเลือกอาคารก่อนทำการจอง" });
      if (startTime >= endTime)
        return res.status(400).json({ message: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด" });

      const newStart = toDateTime(startDate, startTime);
      const newEnd = toDateTime(endDate, endTime);
      if (!(newStart < newEnd))
        return res.status(400).json({ message: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด" });

      const stadium = await Stadium.findByPk(stadiumId);
      if (!stadium) return res.status(404).json({ message: "Stadium not found" });

      const bId = normalizedBuildingIds[0];
      const firstBuilding = await Building.findByPk(bId);
      const isOutdoorStadium = firstBuilding?.name === "สนามกีฬากลางแจ้ง";

      const conflictWhere = {
        buildingId: bId,
        status: { [Op.in]: ["pending", "confirmed"] },
        startDate: { [Op.lt]: newEnd },
        endDate: { [Op.gt]: newStart },
      };

      // สนามกีฬากลางแจ้งอนุญาตให้จองซ้ำข้าม stadium ได้ — เช็ค conflict เฉพาะ stadium เดิม
      if (isOutdoorStadium) {
        conflictWhere.stadiumId = stadiumId;
      }

      const conflict = await Booking.findOne({ where: conflictWhere });
      if (conflict)
        return res.status(409).json({ message: "ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น" });

      for (const item of normalizedEquipment)
        await Equipment.decrement({ quantity: item.quantity }, { where: { id: item.equipmentId } });

      const booking = await Booking.create({
        userId, stadiumId,
        name: activityName?.trim() || "การจองสนาม",
        activityName: activityName?.trim() || "",
        startDate: newStart, endDate: newEnd, startTime, endTime,
        status: "pending", filePath, buildingId: bId,
        bookingType: "normal",
        // note ไม่ถูกบันทึกสำหรับการจองปกติ (null)
      });

      await booking.addBuildings(normalizedBuildingIds);

      for (const item of normalizedEquipment)
        await BookingEquipment.create({ bookingId: booking.id, equipmentId: item.equipmentId, quantity: item.quantity });

      const activeCount = await Booking.count({
        where: { stadiumId, status: { [Op.in]: ["pending", "confirmed"] } },
      });
      stadium.statusStadium = activeCount > 0 ? "IsBooking" : "Available";
      await stadium.save();

      const populated = await Booking.findByPk(booking.id, {
        include: [
          { model: Userr, attributes: ["fullname", "phoneNumber", "email", "fieldOfStudy", "year"] },
          { model: Stadium, attributes: ["nameStadium", "descriptionStadium"] },
          { model: Building, attributes: ["name"], through: { attributes: [] } },
          { model: Equipment, attributes: ["name", "quantity"], through: { attributes: ["quantity"] } },
        ],
      });

      return res.status(201).json({ success: true, message: "Stadium booked successfully", booking, populatedBooking: populated });

    } catch (error) {
      console.error("Error booking stadium:", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  });
};

// =================== CREATE: ตารางเรียน ===================
export const bookClassSchedule = async (req, res) => {
  try {
    const { year, term, rangeStart, rangeEnd, blocks, userId, stadiumId, buildingId } = req.body;

    if (!Array.isArray(blocks) || blocks.length === 0)
      return res.status(400).json({ message: "กรุณาเพิ่มรายวิชาอย่างน้อย 1 รายการ" });
    if (!rangeStart || !rangeEnd)
      return res.status(400).json({ message: "กรุณาระบุช่วงวันที่" });
    if (!userId)     return res.status(400).json({ message: "กรุณาระบุ userId" });
    if (!stadiumId)  return res.status(400).json({ message: "กรุณาเลือกสนาม" });
    if (!buildingId) return res.status(400).json({ message: "กรุณาเลือกอาคาร" });

    const createdBookings = [];
    const skipped = [];

    for (const block of blocks) {
      // ── รับ note แยกออกจาก activityName ──────────────────────────────────
      const { date, startHour, endHour, subject, note } = block;

      const startHH = String(startHour).padStart(2, "0") + ":00";
      const endHH   = String(endHour).padStart(2, "0")   + ":00";

      const newStart = dayjs.tz(date, "Asia/Bangkok").hour(startHour).minute(0).second(0).millisecond(0).toDate();
      const newEnd   = dayjs.tz(date, "Asia/Bangkok").hour(endHour).minute(0).second(0).millisecond(0).toDate();

      const conflict = await Booking.findOne({
        where: {
          bookingType: "class_schedule",
          academicYear: year ?? null,
          academicTerm: term ?? null,
          status: { [Op.in]: ["pending", "confirmed"] },
          startDate: { [Op.lt]: newEnd },
          endDate:   { [Op.gt]: newStart },
        },
      });

      if (conflict) {
        skipped.push(dayjs(date).format("YYYY-MM-DD"));
        continue;
      }

      const booking = await Booking.create({
        name: subject?.trim() || "ตารางเรียน",
        // ── activityName เก็บแค่ชื่อวิชา ไม่ยัด "| ห้อง" อีกต่อไป ───────────
        activityName: subject?.trim() || "ตารางเรียน",
        // ── note เก็บแยก null ถ้าไม่ได้ใส่ ────────────────────────────────────
        note: note?.trim() || null,
        startDate: newStart,
        endDate:   newEnd,
        startTime: startHH,
        endTime:   endHH,
        status: "pending",
        bookingType: "class_schedule",
        academicYear: year ?? null,
        academicTerm: term ?? null,
        userId:     Number(userId),
        stadiumId:  Number(stadiumId),
        buildingId: Number(buildingId),
      });

      createdBookings.push(booking);
    }

    return res.status(201).json({
      success: true,
      message: `บันทึกตารางเรียนสำเร็จ ${createdBookings.length} รายการ`,
      totalCreated: createdBookings.length,
      skipped,
      bookings: createdBookings,
    });

  } catch (error) {
    console.error("bookClassSchedule error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =================== READ: ดึง booking ประเภทตารางเรียน ===================
export const getClassScheduleBookings = async (req, res) => {
  try {
    const { weekStart, year, term } = req.query;

    const where = { bookingType: "class_schedule" };

    if (weekStart) {
      const start = dayjs(weekStart).startOf("day").toDate();
      const end   = dayjs(weekStart).add(6, "day").endOf("day").toDate();
      where.startDate = { [Op.between]: [start, end] };
    }
    if (year)  where.academicYear = Number(year);
    if (term)  where.academicTerm = Number(term);

    const bookings = await Booking.findAll({
      where,
      attributes: [
        "id", "name", "activityName",
        "startDate", "endDate", "startTime", "endTime",
        "status", "bookingType",
        "academicYear", "academicTerm",
        "note",   // ── ส่ง note กลับไปด้วย ──────────────────────────────────
      ],
      order: [["startDate", "ASC"]],
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("getClassScheduleBookings error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =================== READ: ปฏิทินวันว่าง (ทั้งเดือน) ===================
export const getAvailableDates = async (req, res) => {
  try {
    const { stadiumId, year, month } = req.query;
    if (!stadiumId || !year || !month)
      return res.status(400).json({ message: "stadiumId, year, and month จำเป็นต้องระบุ" });

    const today = dayjs().format("YYYY-MM-DD");
    const startOfMonth = dayjs(`${year}-${month}-01`).startOf("month");
    const endOfMonth = dayjs(`${year}-${month}-01`).endOf("month");

    const stadium = await Stadium.findByPk(stadiumId);
    if (!stadium) return res.status(404).json({ message: "ไม่พบข้อมูลสนาม" });

    if (stadium.statusStadium === "Available") {
      const totalDays = endOfMonth.date();
      const availableDates = [];
      for (let d = 1; d <= totalDays; d++) {
        const date = dayjs(`${year}-${month}-${String(d).padStart(2, "0")}`).format("YYYY-MM-DD");
        availableDates.push({ date, status: dayjs(date).isBefore(today, "day") ? "ไม่ได้" : "ว่าง" });
      }
      return res.status(200).json({ dates: availableDates });
    }

    const bookings = await Booking.findAll({
      where: {
        stadiumId,
        status: { [Op.in]: ["confirmed", "pending"] },
        [Op.or]: [
          { startDate: { [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()] } },
          { endDate: { [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()] } },
          { startDate: { [Op.lte]: startOfMonth.toDate() }, endDate: { [Op.gte]: endOfMonth.toDate() } },
        ],
      },
      attributes: ["startDate", "endDate"],
    });

    const bookedSet = new Set();
    bookings.forEach((b) => {
      let cur = dayjs(b.startDate).startOf("day");
      const end = dayjs(b.endDate).startOf("day");
      while (cur.isBefore(end, "day") || cur.isSame(end, "day")) {
        if (cur.isBetween(startOfMonth, endOfMonth, "day", "[]"))
          bookedSet.add(cur.format("YYYY-MM-DD"));
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
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        { model: Stadium, attributes: ["nameStadium", "descriptionStadium"] },
        { model: Building, attributes: ["name"], through: { attributes: [] } },
        { model: Equipment, attributes: ["id", "name"], through: { model: BookingEquipment, attributes: ["quantity"] } },
        { model: Userr, attributes: ["fullname", "phoneNumber", "email", "fieldOfStudy", "year"] },
      ],
    });
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
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        { model: Stadium, attributes: ["nameStadium", "imageUrl", "descriptionStadium", "contactStadium"] },
        { model: Building, attributes: ["name"], through: { attributes: [] } },
        { model: Equipment, attributes: ["name", "quantity"], through: { attributes: ["quantity"] } },
        { model: Userr, attributes: ["fullname", "phoneNumber", "email", "fieldOfStudy", "year"] },
      ],
    });
    return res.json(bookings);
  } catch (err) {
    console.error("getUserBookings error:", err);
    return res.status(500).json({ message: "server error" });
  }
};

// =================== READ: จองตามวัน/เดือน (สำหรับ dashboard) ===================
// filter ด้วย createdAt ให้ตรงกับกราฟ (กราฟนับจาก createdAt เช่นกัน)
export const getBookingsByDate = async (req, res) => {
  try {
    const { date, year, month } = req.query;

    let startRange, endRange;

    if (date) {
      startRange = dayjs.tz(date, "Asia/Bangkok").startOf("day").toDate();
      endRange   = dayjs.tz(date, "Asia/Bangkok").endOf("day").toDate();
    } else if (year && month) {
      const y = Number(year);
      const m = Number(month);
      const base = `${y}-${String(m).padStart(2, "0")}-01`;
      startRange = dayjs.tz(base, "Asia/Bangkok").startOf("month").toDate();
      endRange   = dayjs.tz(base, "Asia/Bangkok").endOf("month").toDate();
    } else {
      return res.status(400).json({ message: "กรุณาระบุ date หรือ year+month" });
    }

    const bookings = await Booking.findAll({
      where: {
        // ใช้ createdAt ให้ตรงกับที่กราฟนับ
        createdAt: { [Op.between]: [startRange, endRange] },
      },
      include: [
        { model: Userr,    attributes: ["fullname", "phoneNumber", "email"] },
        { model: Stadium,  attributes: ["nameStadium"] },
        { model: Building, attributes: ["name"], through: { attributes: [] } },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("getBookingsByDate error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =================== READ: ทั้งหมด ===================
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: Stadium, attributes: ["nameStadium", "descriptionStadium"] },
        { model: Building, attributes: ["name"], through: { attributes: [] } },
        { model: Equipment, attributes: ["name", "quantity"], through: { attributes: ["quantity"] } },
        { model: Userr, attributes: ["fullname", "phoneNumber", "email", "fieldOfStudy", "year"] },
      ],
    });
    if (!bookings.length) return res.status(404).json({ message: "No bookings found" });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    booking.status = "confirmed";
    await booking.save();
    return res.status(200).json({ message: "Booking confirmed successfully", booking });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  console.log("CANCEL bookingId:", req.params.id);
  console.log("CANCEL body:", req.body);

  try {
    const { cancelReason } = req.body;
    const { id } = req.params;

    if (!Number.isInteger(Number(id)))
      return res.status(400).json({ message: "invalid booking id" });

    const booking = await Booking.findByPk(id, {
      include: [{ model: Equipment, attributes: ["id", "name", "quantity"], through: { attributes: ["quantity"] } }],
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "canceled")
      return res.status(200).json({ message: "Booking is already canceled", booking });

    if (Array.isArray(booking.Equipment) && booking.Equipment.length > 0) {
      for (const item of booking.Equipment) {
        const eqId = item.id;
        const qty = Number(item.BookingEquipment?.quantity) || 0;
        if (qty <= 0) continue;
        await Equipment.increment({ quantity: qty }, { where: { id: eqId } });
        await Equipment.update({ status: "available" }, { where: { id: eqId } });
      }
    }

    await Booking.update({ status: "canceled", cancelReason: cancelReason || "" }, { where: { id } });

    const updatedBooking = await Booking.findByPk(id);

    const activeCount = await Booking.count({
      where: { stadiumId: booking.stadiumId, status: { [Op.in]: ["pending", "confirmed"] } },
    });

    await Stadium.update(
      { statusStadium: activeCount > 0 ? "IsBooking" : "active" },
      { where: { id: booking.stadiumId } }
    );

    return res.status(200).json({ message: "Booking canceled successfully", booking: updatedBooking });
  } catch (error) {
    console.error("=== Error canceling booking ===", error);
    return res.status(500).json({ message: "Server error", error: error?.message || "unknown" });
  }
};

export const getReturnedBookings = async (req, res) => {
  try {
    const returned = await Booking.findAll({
      where: { status: "Return Success" },
      include: [
        { model: Userr, attributes: ["fullname", "phoneNumber", "email", "fieldOfStudy", "year"] },
        { model: Stadium, attributes: ["nameStadium", "descriptionStadium"] },
        { model: Building, attributes: ["name"], through: { attributes: [] } },
        { model: Equipment, attributes: ["name", "quantity"], through: { attributes: ["quantity"] } },
      ],
    });
    if (!returned.length) return res.status(404).json({ message: "No returned bookings found" });
    return res.status(200).json(returned);
  } catch (error) {
    console.error("Error fetching returned bookings:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMonthlyBookingStats = async (req, res) => {
  try {
    const stats = await Booking.findAll({
      attributes: [
        [fn("YEAR", col("startDate")), "year"],
        [fn("MONTH", col("startDate")), "month"],
        [fn("COUNT", col("id")), "count"],
      ],
      group: [literal("YEAR(startDate)"), literal("MONTH(startDate)")],
      order: [[literal("YEAR(startDate)"), "ASC"], [literal("MONTH(startDate)"), "ASC"]],
      raw: true,
    });
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching monthly booking stats:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [{ model: Equipment, attributes: ["id", "name", "quantity"], through: { model: BookingEquipment, attributes: ["quantity"] } }],
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "confirmed") return res.status(400).json({ message: "Only confirmed bookings can be reset" });

    for (const item of booking.Equipment ?? []) {
      const qty = item.BookingEquipment?.quantity ?? 0;
      const eq = await Equipment.findByPk(item.id);
      if (eq) await eq.update({ status: "available", quantity: eq.quantity + qty });
    }

    booking.status = "Return Success";
    await booking.save();

    const activeCount = await Booking.count({
      where: { stadiumId: booking.stadiumId, status: { [Op.in]: ["pending", "confirmed"] } },
    });

    await Stadium.update(
      { statusStadium: activeCount > 0 ? "IsBooking" : "active" },
      { where: { id: booking.stadiumId } }
    );

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

    const daily = await Booking.findAll({
      attributes: [
        [fn("DAY", col("createdAt")), "day"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(year, month - 1, 1),
          [Op.lt]: new Date(year, month, 1),
        },
      },
      group: [literal("DAY(createdAt)")],
      order: [[literal("DAY(createdAt)"), "ASC"]],
      raw: true,
    });
    return res.status(200).json(daily);
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return res.status(500).json({ message: "Failed to fetch daily booking stats" });
  }
};

export const bookMonthlyStadium = async (req, res) => {
  try {
    const { userId, stadiumId, buildingId, startMonth, startYear, endMonth, endYear, dayOfWeek } = req.body;

    const startTime = "08:00";
    const endTime = "18:00";

    if (!userId || !stadiumId || !buildingId)
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });

    const start = dayjs(`${startYear}-${startMonth + 1}-01`);
    const end = dayjs(`${endYear}-${endMonth + 1}-01`).endOf("month");
    let current = start.startOf("month");

    const createdBookings = [];
    const skippedDates = [];

    while (current.isBefore(end) || current.isSame(end)) {
      const daysInMonth = current.daysInMonth();

      for (let d = 1; d <= daysInMonth; d++) {
        const date = current.date(d);
        if (date.day() !== dayOfWeek) continue;

        const newStart = toDateTime(date.toDate(), startTime);
        const newEnd = toDateTime(date.toDate(), endTime);

        const conflict = await Booking.findOne({
          where: {
            stadiumId,
            status: { [Op.in]: ["pending", "confirmed"] },
            startDate: { [Op.lt]: newEnd },
            endDate: { [Op.gt]: newStart },
          },
        });

        if (conflict) { skippedDates.push(date.format("YYYY-MM-DD")); continue; }

        const booking = await Booking.create({
          userId: 1, stadiumId, buildingId,
          name: "ตารางเรียน", activityName: "ตารางเรียน",
          startDate: newStart, endDate: newEnd, startTime, endTime,
          status: "pending", bookingType: "normal",
        });

        createdBookings.push(booking);
      }

      current = current.add(1, "month");
    }

    return res.status(201).json({
      success: true,
      message: "สร้าง booking รายเดือนสำเร็จ",
      totalCreated: createdBookings.length,
      skipped: skippedDates,
      bookings: createdBookings,
    });

  } catch (error) {
    console.error("monthly booking error:", error);
    return res.status(500).json({ message: "server error", error: error.message });
  }
};
