import mongoose from "mongoose";
import dotenv from "dotenv";
import Equipment from "../models/Equipment.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI, { dbName: "booking" });

await Equipment.deleteMany();
await Equipment.insertMany([
  { name: "ลูกฟุตบอล", quantity: 10, status: "available" },
  { name: "เสื้อแบ่งทีม", quantity: 20, status: "available" },
  { name: "ลูกบาสเก็ตบอล", quantity: 8, status: "available" }
]);

console.log("✅ Equipments seeded");
await mongoose.disconnect();
process.exit();
