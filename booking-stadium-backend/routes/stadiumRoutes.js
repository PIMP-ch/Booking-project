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

/** ---------- Multer Config ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads/stadiums");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `stadium_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

/** ---------- Stadium CRUD ---------- */
router.get("/", getStadiums);
router.post("/", createStadium);
router.put("/:id", updateStadium);
router.delete("/:id", deleteStadium);

/** ---------- Upload Multiple Images ---------- */
// แก้ไขให้ตรงกับ api.js ที่ส่งมาเป็น /stadiums/:id/images
router.post("/:id/images", upload.array("images", 10), async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบสนามกีฬา" });

    const newPaths = req.files.map(file => `/uploads/stadiums/${file.filename}`);
    
    // ตรวจสอบว่า imageUrl เป็น array หรือไม่ ถ้าไม่ให้สร้างใหม่
    if (!Array.isArray(stadium.imageUrl)) stadium.imageUrl = [];
    
    stadium.imageUrl.push(...newPaths);
    await stadium.save();

    res.json({ message: "อัปโหลดรูปสำเร็จ", stadium });
  } catch (err) {
    res.status(500).json({ message: "อัปโหลดไม่สำเร็จ", error: err.message });
  }
});

/** ---------- Delete Stadium Image by Index ---------- */
router.delete("/:id/images/:index", async (req, res) => {
  try {
    const { id, index } = req.params;
    const stadium = await Stadium.findById(id);
    const targetIndex = parseInt(index);

    if (!stadium) {
      return res.status(404).json({ message: "ไม่พบข้อมูลสนาม" });
    }

    // --- ส่วนที่แก้ไขเพื่อป้องกัน Error 400 ---
    let imagePathToDelete = "";

    // กรณีเป็น Array (หลายรูป)
    if (Array.isArray(stadium.imageUrl)) {
      if (stadium.imageUrl[targetIndex]) {
        imagePathToDelete = stadium.imageUrl[targetIndex];
        stadium.imageUrl.splice(targetIndex, 1);
      } else {
        return res.status(400).json({ message: "ไม่พบรูปภาพในตำแหน่งที่ระบุ" });
      }
    } 
    // กรณีเป็น String (รูปเดียว - เผื่อไว้)
    else if (typeof stadium.imageUrl === "string" && stadium.imageUrl !== "") {
      imagePathToDelete = stadium.imageUrl;
      stadium.imageUrl = ""; 
    } else {
      return res.status(400).json({ message: "ไม่มีรูปภาพให้ลบ" });
    }

    // --- การลบไฟล์จริง ---
    if (imagePathToDelete) {
      const relativePath = imagePathToDelete.replace(/^\//, "");
      const filePath = path.join(process.cwd(), relativePath);
      
      console.log("กำลังลบไฟล์:", filePath); // ดูใน Terminal ว่า Path ถูกไหม

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await stadium.save();
    res.json({ message: "ลบรูปสำเร็จ", imageUrl: stadium.imageUrl });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

export default router;