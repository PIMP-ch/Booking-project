import Building from "../models/Buildingg.js";
import { Op } from "sequelize";
import Booking from "../models/Bookingg.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

export const getBuildings = async (_req, res) => {
    try {
        const buildings = await Building.findAll({
            order: [["createdAt", "DESC"]]
        });
        res.json(buildings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createBuilding = async (req, res) => {
    try {
        const { name, active } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "กรุณาระบุชื่ออาคาร" });
        }
        const building = await Building.create({ name: name.trim(), active: active ?? true });
        res.status(201).json({ message: "สร้างอาคารสำเร็จ", building });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, active } = req.body;
        const building = await Building.findByPk(id);
        if (!building) return res.status(404).json({ message: "ไม่พบอาคาร" });
        if (name !== undefined && !name.trim()) {
            return res.status(400).json({ message: "ชื่ออาคารต้องไม่ว่างเปล่า" });
        }
        await building.update({
            ...(name !== undefined && { name: name.trim() }),
            ...(active !== undefined && { active }),
        });
        res.json({ message: "อัปเดตอาคารสำเร็จ", building });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const building = await Building.findByPk(id);
        if (!building) return res.status(404).json({ message: "ไม่พบอาคาร" });
        await building.destroy();
        res.json({ message: "ลบอาคารสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const checkBuildingAvaliable = async (req, res) => {
    try {
        let { stadiumId, buildingId, startDate, endDate, startTime, endTime } = req.body;
        console.log({ stadiumId, buildingId, startDate, endDate, startTime, endTime })

        // ================= VALIDATION =================
        if (!stadiumId || !buildingId || !startDate) {
            return res.status(400).json({
                message: "กรุณาส่งข้อมูลให้ครบ",
            });
        }

        if (!endDate) endDate = startDate;

        const startStr = dayjs(startDate).format("YYYY-MM-DD");
        const endStr   = dayjs(endDate).format("YYYY-MM-DD");

        // สร้าง datetime ใน timezone Bangkok เสมอ ไม่ depend on server timezone
        const newStart = dayjs.tz(`${startStr} ${startTime || "00:00"}`, "Asia/Bangkok").toDate();
        const newEnd   = dayjs.tz(`${endStr}   ${endTime   || "23:59"}`, "Asia/Bangkok").toDate();

        // ================= ตรวจสอบชื่ออาคาร =================
        const building = await Building.findByPk(buildingId);
        const isOutdoorStadium = building?.name === "สนามกีฬากลางแจ้ง";

        // ================= CHECK CONFLICT =================
        const conflictWhere = {
            buildingId: String(buildingId),
            status: {
                [Op.notIn]: ["canceled", "Return Success"],
            },
            startDate: {
                [Op.lt]: newEnd,
            },
            endDate: {
                [Op.gt]: newStart,
            },
        };

        // สนามกีฬากลางแจ้งอนุญาตให้จองซ้ำข้าม stadium ได้ — เช็ค conflict เฉพาะ stadium เดิม
        if (isOutdoorStadium) {
            conflictWhere.stadiumId = stadiumId;
        }

        const conflict = await Booking.findOne({ where: conflictWhere });

        // ================= RESPONSE =================
        if (conflict) {
            return res.status(200).json({
                available: false,
                message: "❌ อาคารนี้ถูกจองแล้วในช่วงเวลานี้",
            });
        }

        return res.status(200).json({
            available: true,
            message: "✅ สามารถจองได้",
        });

    } catch (err) {
        console.error("checkBuildingAvaliable error:", err);
        return res.status(500).json({
            message: err.message,
        });
    }
};