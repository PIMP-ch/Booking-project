import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BookingEquipment = sequelize.define("BookingEquipment", {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, { timestamps: false });

export default BookingEquipment;