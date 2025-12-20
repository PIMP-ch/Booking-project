// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stadiumId: { type: mongoose.Schema.Types.ObjectId, ref: "Stadium", required: true },
    equipment: [{
        equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
        quantity: { type: Number, required: true, min: 1 }
    }],
    startDate: { type: Date, required: true }, // วันที่เริ่ม
    endDate: { type: Date, required: true },   // วันที่สิ้นสุด
    startTime: { type: String, required: true }, // เวลาเริ่ม เช่น "10:00"
    endTime: { type: String, required: true },   // เวลาสิ้นสุด เช่น "12:00"
    status: {
        type: String,
        enum: ["pending", "confirmed", "canceled", "Return Success"],
        default: "pending",
    },
}, { timestamps: true });

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking;
