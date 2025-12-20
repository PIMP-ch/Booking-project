import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["superadmin", "admin", "staff"], default: "staff" },
    password: { type: String, required: true },

    // 🔹 URL ของรูปโปรไฟล์ (เส้นทางสาธารณะจาก backend)
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const Staff = mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
export default Staff;
