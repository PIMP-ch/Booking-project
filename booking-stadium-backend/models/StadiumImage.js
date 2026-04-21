import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Stadium from "./Stadiumm.js";

const StadiumImage = sequelize.define("StadiumImage", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    stadiumId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Stadium,
            key: "id",
        },
        onDelete: "CASCADE", // ลบ stadium → ลบรูปตามอัตโนมัติ
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: "stadium_images",
    timestamps: true,
});

// Association
Stadium.hasMany(StadiumImage, { foreignKey: "stadiumId", as: "images" });
StadiumImage.belongsTo(Stadium, { foreignKey: "stadiumId", as: "stadium" });

export default StadiumImage;