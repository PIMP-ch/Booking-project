import mongoose from "mongoose";

const StadiumSchema = new mongoose.Schema({
    nameStadium: { type: String, required: true },
    descriptionStadium: { type: String, required: true },
    contactStadium: { type: String, required: true },
    statusStadium: {
        type: String,
        enum: ["active", "inactive", "IsBooking"], // เพิ่มสถานะ IsBooking
        default: "active",
    },
    imageUrl: { type: String, default: ""},
},
    { timestamps: true });

const Stadium = mongoose.model("Stadium", StadiumSchema);
export default Stadium;
