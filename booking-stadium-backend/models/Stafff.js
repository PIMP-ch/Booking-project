import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Staff = sequelize.define("Staff", {
    fullname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    role: {
        type: DataTypes.ENUM("superadmin", "admin", "staff"),
        allowNull: false,
        defaultValue: "staff",
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    avatarUrl: {
        type: DataTypes.STRING,
        defaultValue: "",
    },
}, {
    timestamps: true,
});

export default Staff;