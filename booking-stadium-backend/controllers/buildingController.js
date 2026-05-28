import Building from "../models/Buildingg.js";
import { Op } from "sequelize";
import Booking from "../models/Bookingg.js";

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

export const checkBuildingAvaliable = async (req, res) => {
    try {
        let { stadiumId, buildingId, startDate, endDate } = req.body;
        console.log({ stadiumId, buildingId, startDate, endDate })

        // ================= VALIDATION =================
        if (!stadiumId || !buildingId || !startDate) {
            return res.status(400).json({
                message: "กรุณาส่งข้อมูลให้ครบ",
            });
        }

        if (!endDate) {
            endDate = startDate
        }

        const startStr = new Date(startDate).toISOString().split('T')[0];
        const endStr = new Date(endDate).toISOString().split('T')[0];

        // สร้าง Date Object และบังคับเวลาเป็น 01:00:00.000 UTC
        const newStart = new Date(`${startStr}T01:00:00.000Z`);
        const newEnd = new Date(`${endStr}T11:00:00.000Z`);

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