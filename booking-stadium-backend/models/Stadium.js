import mongoose from "mongoose";

const StadiumSchema = new mongoose.Schema({
    nameStadium: { type: String, required: true },
    descriptionStadium: { type: String, required: true },
    contactStadium: { type: String, required: true },
    statusStadium: {
        type: String,
        enum: ["active", "inactive", "IsBooking"],
        default: "active",
    },
    // ✅ ต้องเป็น Array ของ String เพื่อเก็บหลายรูป
    imageUrl: { type: [String], default: [] }, 
    buildingIds: [
        {type: mongoose.Schema.Types.ObjectId, ref: "Building", default: []}
    ],
}, { timestamps: true, collection: "stadia" });

const Stadium = mongoose.model("Stadium", StadiumSchema);
export default Stadium;