import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";

import {
  createStaff,
  deleteStaff,
  updateStaff,
  getAllStaff,
  loginStaff,
} from "../controllers/staffController.js";
import Staff from "../models/Staff.js";
import { message } from "hawk/lib/client.js";

const router = express.Router();

/* =========================
 *  ส่วนอัปโหลดรูปโปรไฟล์
 * ========================= */

// ให้แน่ใจว่าโฟลเดอร์ปลายทางมีอยู่
const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

// ตั้งค่า multer เก็บไฟล์ลงดิสก์
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase(); // .jpg/.png/.webp
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /image\/(jpeg|png|webp|gif)/.test(file.mimetype);
  if (!ok) return cb(new Error("รองรับเฉพาะไฟล์ภาพ JPEG/PNG/WebP/GIF"));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

// POST /api/staff/:id/avatar  -> อัปโหลดและอัปเดต avatarUrl
router.post("/:id/avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "ไม่พบไฟล์ภาพ" });

    // พาธสาธารณะสำหรับ frontend (เสิร์ฟผ่าน app.use('/uploads', express.static(...)))
    const publicPath = `/uploads/avatars/${req.file.filename}`;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { avatarUrl: publicPath },
      { new: true }
    );

    if (!staff) return res.status(404).json({ message: "ไม่พบพนักงาน" });

    res.json({ message: "อัปโหลดสำเร็จ", staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "อัปโหลดไม่สำเร็จ" });
  }
});

//ลบ avatar
router.delete("/:id/avatar", async (req, res) => {
  try{
    const staff = await Staff.findById(req.params.id);
    if(!staff) return res.status(404).json({message: "ไม่พบพนักงาน"});

    if (staff.avatarUrl) {
      //ลบไฟล์จริงออกกจาก uploads
      const filePath = path.join(process.cwd(), staff.avatarUrl);
      if(fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    staff.avatarUrl = "";
    await staff.save();

    res.json({message: "ลบรูปสำเร็จ", staff});
  } catch (err) {
    res.status(500).json({message: "ลบรูปไม่สำเร็จ", error: err.message});
  }
});

/* ==============
 *  Routes เดิม
 * ============== */

// ✅ สร้างพนักงานใหม่
router.post("/", createStaff);

// ✅ ลบพนักงาน
router.delete("/:id", deleteStaff);

// ✅ แก้ไขข้อมูลพนักงาน
router.put("/:id", updateStaff);

// ✅ ดูข้อมูลพนักงานทั้งหมด
router.get("/", getAllStaff);

// ✅ Login พนักงาน
router.post("/login", loginStaff);

export default router;
