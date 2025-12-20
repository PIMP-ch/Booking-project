import mongoose from "mongoose";
import dotenv from "dotenv";
import Stadium from "../models/Stadium.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI, { dbName: "booking" });

await Stadium.deleteMany();
await Stadium.insertMany([
  {
    nameStadium: "สนามฟุตบอล A",
    descriptionStadium: "หญ้าเทียม ขนาด 7 คน",
    contactStadium: "080-111-2222",
    statusStadium: "active"
  },
  {
    nameStadium: "สนามบาส B",
    descriptionStadium: "ในร่ม มาตรฐาน",
    contactStadium: "080-333-4444",
    statusStadium: "active"
  }
]);

console.log("✅ Stadiums seeded");
await mongoose.disconnect();
process.exit();
