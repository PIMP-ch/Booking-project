import mongoose from "mongoose";
import dotenv from "dotenv";
import Staff from "../models/Staff.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI, { dbName: "booking" });

await Staff.deleteMany();
await Staff.insertMany([
  {
    fullname: "Super Admin",
    email: "superadmin@booking.local",
    role: "superadmin",
    password: "admin123"
  },
  {
    fullname: "Operator One",
    email: "operator1@booking.local",
    role: "staff",
    password: "staff123"
  }
]);

console.log("✅ Staffs seeded");
await mongoose.disconnect();
process.exit();
