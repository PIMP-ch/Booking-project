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
        unique: true,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
        allowNull: false,
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
    timestamps: true, // createdAt, updatedAt อัตโนมัติ
    validate: {
        // ✅ Validate student fields
        studentFieldsRequired() {
            if (this.userType === "student") {
                if (!this.fieldOfStudy) throw new Error("fieldOfStudy is required for student");
                if (!this.year) throw new Error("year is required for student");
            }
        },
        // ✅ Validate staff fields
        staffFieldsRequired() {
            if (this.userType === "staff") {
                if (!this.department) throw new Error("department is required for staff");
            }
        }
    }
});

export default Userr;