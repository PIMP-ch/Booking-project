import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SportCategory = sequelize.define("SportCategory", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    tableName: "sport_categories",
    timestamps: true,
});

export default SportCategory;