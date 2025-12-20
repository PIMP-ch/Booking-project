import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI, { dbName: "booking" });

await User.deleteMany();
await User.insertMany([
  {
    fullname: "Mint KC",
    email: "mint@example.com",
    phoneNumber: "0800000001",
    fieldOfStudy: "Computer Science",
    year: 4,
    password: "123456"
  },
  {
    fullname: "Alex Chan",
    email: "alex@example.com",
    phoneNumber: "0800000002",
    fieldOfStudy: "Information Tech",
    year: 3,
    password: "123456"
  }
]);

console.log("✅ Users seeded");
await mongoose.disconnect();
process.exit();
