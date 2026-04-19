import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BookingEquipment = sequelize.define("BookingEquipment", {
    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    equipmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, { timestamps: false });

export default BookingEquipment;