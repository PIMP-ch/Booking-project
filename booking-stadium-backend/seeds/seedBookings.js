import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Stadium from "../models/Stadium.js";
import Equipment from "../models/Equipment.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI, { dbName: "booking" });

await Booking.deleteMany();

// ดึง user / stadium / equipment ที่มีอยู่แล้ว
const user = await User.findOne();
const stadium = await Stadium.findOne();
const equipment = await Equipment.findOne();

await Booking.insertMany([
  {
    userId: user._id,
    stadiumId: stadium._id,
    equipment: [
      { equipmentId: equipment._id, quantity: 2 }
    ],
    startDate: new Date("2025-09-15"),
    endDate: new Date("2025-09-15"),
    startTime: "10:00",
    endTime: "12:00",
    status: "pending"
  }
]);

console.log("✅ Bookings seeded");
await mongoose.disconnect();
process.exit();