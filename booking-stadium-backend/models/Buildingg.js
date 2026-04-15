import { DataTypes } from "sequelize";
import sequelize from "../config/database.js"; // ปรับ path ตามโปรเจคคุณ

const Building = sequelize.define(
    "Building",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "buildings", // ตั้งชื่อ table (optional)
        timestamps: true, // createdAt, updatedAt
    }
);

export default Building;