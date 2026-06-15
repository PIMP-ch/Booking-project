// server.js
import "dotenv/config"; // โหลด .env ก่อน import อื่นทุกตัว
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import sequelize from "./config/database.js";

import "./models/Userr.js";
import "./models/Stafff.js";
import "./models/Stadiumm.js";
import "./models/Equipmentt.js";
import "./models/Buildingg.js";
import "./models/Bookingg.js";
import "./models/BookingEquipment.js";
import "./models/BookingBuilding.js";
import "./models/EquipmentAdjustmentTransaction.js"; // โหลดก่อน associations เพื่อให้ association ใน model file ทำงานได้
import "./models/associations.js";
import "./models/sportCategory.js";
import "./models/ExecutiveHistory.js"



// ✅ import routes
import authRoutes from "./routes/authRoutes.js";
import stadiumRoutes from "./routes/stadiumRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import buildingRoutes from "./routes/buildingRoutes.js";
import ExecutiveRoutes from "./routes/executiveRoutes.js"
import StadiumImage from "./models/StadiumImage.js";
import EquipmentAdjustmentTransaction from "./models/EquipmentAdjustmentTransaction.js";
import { startInactivityJob } from "./jobs/inactivityJob.js";

// dotenv โหลดแล้วจาก import "dotenv/config" ด้านบน

// เพิ่ม column ใหม่โดยไม่ให้ error ถ้ามีอยู่แล้ว
const runMigrations = async () => {
  const migrations = [
    `ALTER TABLE Users ADD COLUMN status ENUM('NEW','Pending','Active','Inactive','Suspended','Expired','Cancelled','Rejected','Deleted') NOT NULL DEFAULT 'NEW'`,
    `ALTER TABLE Users ADD COLUMN lastLoginAt DATETIME DEFAULT NULL`,
    `ALTER TABLE Users ADD COLUMN deletedAt DATETIME DEFAULT NULL`,
    `ALTER TABLE equipment_adjustment_transactions ADD COLUMN reason ENUM('normal_in','normal_out','damaged','lost','booking_borrow','booking_return') DEFAULT NULL`,
    `ALTER TABLE equipment_adjustment_transactions ADD COLUMN bookingId INT DEFAULT NULL`,
    `ALTER TABLE Bookings ADD COLUMN bookingType ENUM('normal','class_schedule') NOT NULL DEFAULT 'normal'`,
    `ALTER TABLE Bookings ADD COLUMN academicYear INT DEFAULT NULL`,
    `ALTER TABLE Bookings ADD COLUMN academicTerm INT DEFAULT NULL`,
    `ALTER TABLE Bookings ADD COLUMN note TEXT DEFAULT NULL`,
    `ALTER TABLE equipment ADD COLUMN brand VARCHAR(255) NOT NULL DEFAULT ''`,
    `ALTER TABLE equipment ADD COLUMN size VARCHAR(255) NOT NULL DEFAULT ''`,
  ];
  for (const sql of migrations) {
    try {
      await sequelize.query(sql);
      const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
      console.log(`[Migration] เพิ่ม column: ${col}`);
    } catch (e) {
      // ER_DUP_FIELDNAME = column มีอยู่แล้ว ข้ามได้เลย
      if (e.original?.code !== "ER_DUP_FIELDNAME") {
        console.error("[Migration] Error:", e.message);
      }
    }
  }
};

// ✅ ต้องสร้าง __dirname สำหรับ ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ CORS (แก้ origin ให้ตรงกับ frontend ของคุณ)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// ✅ body parser
app.use(express.json());

// ✅ เปิดให้เข้าถึงไฟล์ในโฟลเดอร์ uploads
// เช่น http://localhost:5008/uploads/stadiums/รูป.png
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ✅ เชื่อม DB
// connectDB();

// ✅ ใช้งาน routes
app.use("/api/auth", authRoutes);
app.use("/api/stadiums", stadiumRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/executives",ExecutiveRoutes );

// ✅ Start server
const PORT = process.env.PORT || 5008;
app.listen(PORT, async () => {
  await sequelize.authenticate();
  // sync แบบ force:false — ไม่แตะ table ที่มีอยู่แล้ว ป้องกัน duplicate index
  await sequelize.sync({ force: false });
  // เพิ่ม column ใหม่แบบ safe (ถ้ามีอยู่แล้วก็ข้าม)
  await runMigrations();
  startInactivityJob();
  console.log("Database connected!")
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Static files served at /uploads`);
});


