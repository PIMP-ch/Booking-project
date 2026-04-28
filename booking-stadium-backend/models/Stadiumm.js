import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Stadium = sequelize.define("Stadium", {
    nameStadium: { type: DataTypes.STRING, allowNull: false },
    descriptionStadium: { type: DataTypes.TEXT, allowNull: false },
    contactStadium: { type: DataTypes.STRING, allowNull: false },
    statusStadium: {
        type: DataTypes.ENUM("active", "inactive", "IsBooking"),
        allowNull: false,
        defaultValue: "active",
    },
    sportType: { type: DataTypes.INTEGER, allowNull: true },
}, {
    tableName: "stadium",
    timestamps: true,
});

export default Stadium;