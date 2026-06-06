import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Userr = sequelize.define("User", {
    fullname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique constraint อยู่ที่ DB แล้ว ไม่ใส่ที่นี่เพื่อป้องกัน Sequelize สร้าง index ซ้ำ
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userType: {
        type: DataTypes.ENUM("student", "staff"),
        allowNull: false,
        defaultValue: "student",
    },
    fieldOfStudy: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("NEW", "Pending", "Active", "Inactive", "Suspended", "Expired", "Cancelled", "Rejected", "Deleted"),
        allowNull: false,
        defaultValue: "NEW",
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        defaultValue: null,
    },
    blockUntil: {
        type: DataTypes.DATE,
        defaultValue: null,
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        defaultValue: null,
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        defaultValue: null,
    },
}, {
    timestamps: true,
    paranoid: true, // soft delete — ใช้ deletedAt แทนการลบจริง
    validate: {
        studentFieldsRequired() {
            if (this.userType === "student") {
                if (!this.fieldOfStudy) throw new Error("fieldOfStudy is required for student");
                if (!this.year) throw new Error("year is required for student");
            }
        },
        staffFieldsRequired() {
            if (this.userType === "staff") {
                if (!this.department) throw new Error("department is required for staff");
            }
        }
    }
});

export default Userr;