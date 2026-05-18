import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Booking = sequelize.define("Booking", {
    name: { type: DataTypes.STRING, allowNull: false },
    activityName: { type: DataTypes.STRING, defaultValue: "" },
    cancelReason: { type: DataTypes.STRING, defaultValue: "" },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    startTime: { type: DataTypes.STRING, allowNull: false },
    endTime: { type: DataTypes.STRING, allowNull: false },
    status: {
        type: DataTypes.ENUM("pending", "confirmed", "canceled", "Return Success"),
        allowNull: false,
        defaultValue: "pending",
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    buildingId: { type: DataTypes.INTEGER, allowNull: false },

    // ─── เพิ่มใหม่ ───────────────────────────────────────────────────────────
    // บอกว่าเป็นการจองแบบปกติ หรือ ตารางเรียน
    // ของเก่าทั้งหมดจะได้ค่า default "normal" อัตโนมัติ ไม่กระทบข้อมูลเดิม
    bookingType: {
        type: DataTypes.ENUM("normal", "class_schedule"),
        allowNull: false,
        defaultValue: "normal",
    },

    // เก็บข้อมูลภาค/ปีการศึกษา (ใช้เฉพาะ class_schedule)
    academicYear: {
        type: DataTypes.INTEGER,
        allowNull: true,   // null สำหรับการจองปกติ
    },
    academicTerm: {
        type: DataTypes.INTEGER,
        allowNull: true,   // null สำหรับการจองปกติ
    },
    // ─────────────────────────────────────────────────────────────────────────

}, { timestamps: true });

export default Booking;