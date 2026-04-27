import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Staff from "./Stafff.js";

const ExecutiveHistory = sequelize.define("ExecutiveHistory", {
    staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Staff,
            key: "id",
        },
        onDelete: "CASCADE", // ถ้าลบ Staff -> ลบประวัติด้วย
    },
    startDate: {
        type: DataTypes.DATEONLY, // เก็บแค่วันที่ ไม่มีเวลา
        allowNull: false,
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true, // อาจยังไม่มีวันสิ้นสุด
    },
}, {
    timestamps: true,
});

// ✅ Association: ExecutiveHistory -> Staff (ดึงชื่อผ่าน JOIN)
ExecutiveHistory.belongsTo(Staff, { foreignKey: "staffId", as: "staff" });
Staff.hasMany(ExecutiveHistory, { foreignKey: "staffId", as: "executiveHistories" });

export default ExecutiveHistory;