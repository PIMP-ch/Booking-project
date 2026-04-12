import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Building = sequelize.define("Building", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
});

export default Building;