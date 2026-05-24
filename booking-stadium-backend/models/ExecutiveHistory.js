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
    onDelete: "CASCADE",
  },
  // ✅ เพิ่มฟิลด์ตำแหน่งและเบอร์โทร
  position: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "",
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "",
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  // ✅ สถานะ active/inactive แยกจาก role ของ Staff
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    allowNull: false,
    defaultValue: "active",
  },
  pdfPath: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
}, {
  timestamps: true,
});

ExecutiveHistory.belongsTo(Staff, { foreignKey: "staffId", as: "staff" });
Staff.hasMany(ExecutiveHistory, { foreignKey: "staffId", as: "executiveHistories" });

export default ExecutiveHistory;
