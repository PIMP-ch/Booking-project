import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Equipment from "../models/Equipment.js";
import {
  createEquipment,
  getEquipments,
  deleteEquipment,
  updateEquipment,
} from "../controllers/equipmentController.js";

const router = express.Router();

/** ---------- Multer Config สำหรับรูปอุปกรณ์ ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads/equipments");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `equipment_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|webp|gif$/;
    if (allowed.test((file.mimetype || "").toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

/** ---------- Equipment CRUD ---------- */
router.post("/", createEquipment);
router.get("/", getEquipments);
router.delete("/:id", deleteEquipment);
router.put("/:id", updateEquipment);

/** ---------- Upload Equipment Image ---------- */
router.post("/:id/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "ไม่พบไฟล์ภาพ" });

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: "ไม่พบอุปกรณ์" });

    if (equipment.imageUrl) {
      const relative = equipment.imageUrl.replace(/^[\\/]/, "");
      const filePath = path.join(process.cwd(), relative);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const publicPath = `/uploads/equipments/${req.file.filename}`;
    equipment.imageUrl = publicPath;
    await equipment.save();

    res.json({ message: "อัปโหลดรูปสำเร็จ", equipment });
  } catch (err) {
    res.status(500).json({ message: "อัปโหลดไม่สำเร็จ", error: err.message });
  }
});

/** ---------- Delete Equipment Image ---------- */
router.delete("/:id/image", async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: "ไม่พบอุปกรณ์" });

    if (equipment.imageUrl) {
      const relative = equipment.imageUrl.replace(/^[\\/]/, "");
      const filePath = path.join(process.cwd(), relative);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    equipment.imageUrl = "";
    await equipment.save();

    res.json({ message: "ลบรูปสำเร็จ", equipment });
  } catch (err) {
    res.status(500).json({ message: "ลบรูปไม่สำเร็จ", error: err.message });
  }
});

export default router;
