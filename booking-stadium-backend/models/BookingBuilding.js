import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BookingBuilding = sequelize.define("BookingBuilding", {}, { timestamps: false });

export default BookingBuilding;