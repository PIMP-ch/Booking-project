import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Equipment = sequelize.define("Equipment", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    brand: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    size: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    status: {
        type: DataTypes.ENUM("available", "unavailable"),
        allowNull: false,
        defaultValue: "available",
    },
    imageUrl: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
    sportTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: "equipment",
    timestamps: true,
});

export default Equipment;
