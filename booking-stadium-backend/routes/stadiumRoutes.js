import express from "express";
import {
  createStadium,
  getStadiums,
  updateStadium,
  deleteStadium,
} from "../controllers/stadiumController.js";
import Stadium from "../models/Stadium.js";
import path from "path";
import fs from "fs";
import multer from "multer";

const router = express.Router();

/** ---------- Multer Config สำหรับรูปสนาม ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads/stadiums");
    fs.mkdirSync(uploadPath, { recursive: true }); // ✅ สร้างโฟลเดอร์ถ้ายังไม่มี
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `stadium_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|webp|gif$/;
    if (allowed.test((file.mimetype || "").toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

/** ---------- Stadium CRUD ---------- */
router.get("/", getStadiums);
router.post("/", createStadium);
router.put("/:id", updateStadium);
router.delete("/:id", deleteStadium);

/** ---------- Upload Stadium Image ---------- */
router.post("/:id/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "ไม่พบไฟล์ภาพ" });

    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบสนามกีฬา" });

    // ถ้ามีรูปเก่า → ลบทิ้ง
    if (stadium.imageUrl) {
      const relative = stadium.imageUrl.replace(/^[\\/]/, "");
      const filePath = path.join(process.cwd(), relative);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // กำหนด path ใหม่
    const publicPath = `/uploads/stadiums/${req.file.filename}`;
    stadium.imageUrl = publicPath;
    await stadium.save();

    res.json({ message: "อัปโหลดรูปสำเร็จ", stadium });
  } catch (err) {
    res.status(500).json({ message: "อัปโหลดไม่สำเร็จ", error: err.message });
  }
});

/** ---------- Delete Stadium Image ---------- */
router.delete("/:id/image", async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบสนามกีฬา" });

    if (stadium.imageUrl) {
      const relative = stadium.imageUrl.replace(/^[\\/]/, "");
      const filePath = path.join(process.cwd(), relative);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    stadium.imageUrl = "";
    await stadium.save();

    res.json({ message: "ลบรูปสำเร็จ", stadium });
  } catch (err) {
    res.status(500).json({ message: "ลบรูปไม่สำเร็จ", error: err.message });
  }
});

export default router;
