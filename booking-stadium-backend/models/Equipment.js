import mongoose from "mongoose";

const EquipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    status: { type: String, enum: ["available", "unavailable"], default: "available" },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const Equipment = mongoose.model("Equipment", EquipmentSchema);
export default Equipment;
