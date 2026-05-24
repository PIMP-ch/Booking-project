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
    bookingType: {
        type: DataTypes.ENUM("normal", "class_schedule"),
        allowNull: false,
        defaultValue: "normal",
    },
    academicYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    academicTerm: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    // ── เพิ่มใหม่: หมายเหตุสำหรับตารางเรียน (null = ไม่มี) ──────────────────
    note: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    // ─────────────────────────────────────────────────────────────────────────
}, { timestamps: true });

export default Booking;
