import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import {
  getAllExecutives,
  getExecutiveById,
  createExecutive,
  updateExecutive,
  deleteExecutive,
} from "../controllers/executiveController.js";
import ExecutiveHistory from "../models/ExecutiveHistory.js";

const router = express.Router();

// ─── PDF upload setup ─────────────────────────────────────
const EXEC_DIR = path.join(process.cwd(), "uploads", "executives");
fs.mkdirSync(EXEC_DIR, { recursive: true });

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EXEC_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const pdfFilter = (_req, file, cb) => {
  const ok = file.mimetype === "application/pdf";
  cb(ok ? null : new Error("รองรับเฉพาะไฟล์ PDF"), ok);
};

const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── PDF routes ───────────────────────────────────────────
router.post("/:id/pdf", uploadPdf.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "ไม่พบไฟล์ PDF" });

    const publicPath = `/uploads/executives/${req.file.filename}`;
    const exec = await ExecutiveHistory.findByPk(req.params.id);
    if (!exec) return res.status(404).json({ message: "ไม่พบข้อมูลผู้บริหาร" });

    if (exec.pdfPath) {
      const old = path.join(process.cwd(), exec.pdfPath);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    await exec.update({ pdfPath: publicPath });
    res.json({ message: "อัปโหลด PDF สำเร็จ", pdfPath: publicPath });
  } catch (err) {
    res.status(500).json({ message: "อัปโหลดไม่สำเร็จ", error: err.message });
  }
});

router.delete("/:id/pdf", async (req, res) => {
  try {
    const exec = await ExecutiveHistory.findByPk(req.params.id);
    if (!exec) return res.status(404).json({ message: "ไม่พบข้อมูลผู้บริหาร" });

    if (exec.pdfPath) {
      const filePath = path.join(process.cwd(), exec.pdfPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await exec.update({ pdfPath: null });
    res.json({ message: "ลบไฟล์ PDF สำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: "ลบไฟล์ไม่สำเร็จ", error: err.message });
  }
});

// ─── CRUD routes ──────────────────────────────────────────
router.get("/", getAllExecutives);
router.get("/:id", getExecutiveById);
router.post("/", createExecutive);
router.put("/:id", updateExecutive);
router.delete("/:id", deleteExecutive);

export default router;
