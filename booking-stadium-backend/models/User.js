import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },

    // แนะนำให้ใช้ sparse เพื่อกัน error unique เวลาเป็นค่าว่าง/ไม่มีค่า
    phoneNumber: { type: String, required: true, unique: true, sparse: true, trim: true },

    // ✅ เพิ่มประเภทผู้ใช้
    userType: {
      type: String,
      enum: ["student", "staff"],
      required: true,
      default: "student",
    },

    // ✅ นักศึกษาเท่านั้น
    fieldOfStudy: {
      type: String,
      trim: true,
      required: function () {
        return this.userType === "student";
      },
    },
    year: {
      type: Number,
      min: 1,
      required: function () {
        return this.userType === "student";
      },
    },

    // ✅ บุคลากรเท่านั้น
    department: {
      type: String,
      trim: true,
      required: function () {
        return this.userType === "staff";
      },
      default: null,
    },

    password: { type: String, required: true, minlength: 6 },
    blockUntil: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
