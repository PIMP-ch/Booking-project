import express from "express";
import {
  createStadium,
  getStadiums,
  updateStadium,
  deleteStadium,
  getStadiumById,
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
router.get("/:id", getStadiumById);
router.post("/", createStadium);
router.put("/:id", updateStadium);
router.delete("/:id", deleteStadium);

/** ---------- Upload Stadium Image ---------- */
router.post("/:id/images", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "ไม่พบไฟล์ภาพ" });
    }

    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบสนามกีฬา" });

    const uploadedUrls = req.files.map(
      (file) => `/uploads/stadiums/${file.filename}`
    );

    // ✅ ถ้ายังไม่มี imageUrls ให้ init
    if (!Array.isArray(stadium.imageUrls)) stadium.imageUrls = [];

    // ✅ แบบ Append: เพิ่มรูปใหม่เข้าไป (ไม่ลบรูปเก่า)
    stadium.imageUrls.push(...uploadedUrls);

    // ✅ ตั้งรูปหลักเป็นรูปแรกเสมอ (เพื่อให้หน้าเดิมยังใช้ได้)
    stadium.imageUrl = stadium.imageUrls[0] || "";

    await stadium.save();

    res.json({
      message: "อัปโหลดรูปหลายรูปสำเร็จ",
      imageUrls: stadium.imageUrls,
      stadium,
    });
  } catch (err) {
    res.status(500).json({ message: "อัปโหลดไม่สำเร็จ", error: err.message });
  }
});


/** ---------- Delete Single Stadium Image (by index) ---------- */
router.delete("/:id/images/:index", async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบสนามกีฬา" });

    const index = Number(req.params.index);
    if (!Number.isInteger(index)) {
      return res.status(400).json({ message: "index ไม่ถูกต้อง" });
    }

    // ป้องกันกรณีไม่มี imageUrls
    if (!Array.isArray(stadium.imageUrls)) stadium.imageUrls = [];

    if (index < 0 || index >= stadium.imageUrls.length) {
      return res.status(400).json({ message: "index เกินขอบเขต" });
    }

    // ลบไฟล์บนดิสก์
    const imgUrl = stadium.imageUrls[index]; // เช่น "/uploads/stadiums/xxx.jpg"
    if (imgUrl) {
      const relative = imgUrl.replace(/^[\\/]/, "");
      const filePath = path.join(process.cwd(), relative);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // ลบออกจาก array
    stadium.imageUrls.splice(index, 1);

    // อัปเดตรูปหลักให้เป็นรูปแรกเสมอ (รองรับระบบเดิมที่ยังใช้ imageUrl)
    stadium.imageUrl = stadium.imageUrls[0] || "";

    await stadium.save();

    res.json({ message: "ลบรูปสำเร็จ", stadium });
  } catch (err) {
    res.status(500).json({ message: "ลบรูปไม่สำเร็จ", error: err.message });
  }
});


export default router;
