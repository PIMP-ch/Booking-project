import express from "express";
import {
  createStadium,
  getStadiums,
  updateStadium,
  deleteStadium,
  getStadiumById,
  sportTypes
} from "../controllers/stadiumController.js";
import Stadium from "../models/Stadiumm.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import StadiumImage from "../models/StadiumImage.js";
import { bookMonthlyStadium } from "../controllers/bookingController.js";

const router = express.Router();

/** ---------- Multer Config ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/stadiums/'); // ระบุโฟลเดอร์ที่เก็บรูป
  },
  filename: (req, file, cb) => {
    // เปลี่ยนชื่อเป็น: stadium-เวลาปัจจุบัน.นามสกุลเดิม (ป้องกันชื่อซ้ำและรองรับทุกชื่อไฟล์)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage });
/** ---------- Stadium CRUD ---------- */
router.get("/", getStadiums);
router.get("/sport-types", sportTypes);
router.get("/:id", getStadiumById);
router.post("/", createStadium);
router.put("/:id", updateStadium);
router.delete("/:id", deleteStadium);
router.post('/lock-booking', bookMonthlyStadium)

/** ---------- Upload Multiple Images ---------- */
// แก้ไขให้ตรงกับ api.js ที่ส่งมาเป็น /stadiums/:id/images
router.post("/:id/images", upload.array("images", 10), async (req, res) => {
  try {
    const stadium = await Stadium.findByPk(req.params.id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบสนามกีฬา" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "กรุณาเลือกไฟล์" });
    }

    // ✅ บันทึกแต่ละรูปลงตาราง stadium_images แทน
    const newImages = await StadiumImage.bulkCreate(
      req.files.map((file) => ({
        stadiumId: req.params.id,
        url: `/uploads/stadiums/${file.filename}`,
      }))
    );

    res.json({
      message: "อัปโหลดรูปสำเร็จ",
      imageUrl: newImages.map((img) => img.url), // ✅ ส่งกลับเป็น array of url
    });
  } catch (err) {
    res.status(500).json({ message: "อัปโหลดไม่สำเร็จ", error: err.message });
  }
});

/** ---------- Delete Stadium Image by Index ---------- */
router.delete("/:id/images/0", async (req, res) => {
  try {
    const { id } = req.params; // stadiumId

    console.log(id)

    // หา "รูปสุดท้าย" ของ stadium นี้
    const image = await StadiumImage.findOne({
      where: { stadiumId: id },
      order: [["id", "ASC"]], // หรือใช้ createdAt ก็ได้
    });

    if (!image) {
      return res.status(404).json({ message: "ไม่พบรูปภาพ" });
    }

    // ลบไฟล์จริงในเครื่อง
    if (image.url.startsWith("/uploads/stadiums")) {
      const filePath = path.join(process.cwd(), image.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await image.destroy();

    res.json({
      message: "ลบรูปสุดท้ายสำเร็จ",
      deletedImage: image,
    });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

export default router;