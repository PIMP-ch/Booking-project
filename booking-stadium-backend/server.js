// server.js
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
import "./models/associations.js";
import "./models/sportCategory.js";



// ✅ import routes
import authRoutes from "./routes/authRoutes.js";
import stadiumRoutes from "./routes/stadiumRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import buildingRoutes from "./routes/buildingRoutes.js";
import StadiumImage from "./models/StadiumImage.js";
import EquipmentAdjustmentTransaction from "./models/EquipmentAdjustmentTransaction.js";

dotenv.config();

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
connectDB();

// ✅ ใช้งาน routes
app.use("/api/auth", authRoutes);
app.use("/api/stadiums", stadiumRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/staff", staffRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5008;
app.listen(PORT, async () => {
  await sequelize.authenticate({ alter: true }); // ทดสอบการเชื่อมต่อ DB
  await sequelize.sync(); // สร้าง table อัตโนมัติ
  console.log("Database connected!")
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Static files served at /uploads`);
});
