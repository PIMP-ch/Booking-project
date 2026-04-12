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
}, { timestamps: true });

export default Booking;