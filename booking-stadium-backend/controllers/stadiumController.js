import { message } from "hawk/lib/client.js";
import Stadium from "../models/Stadium.js";

// ✅ เพิ่ม Stadium
export const createStadium = async (req, res) => {
  try {
    const payload = { ...req.body };
    // รองรับกรณีส่ง imageUrl มาจากฟอร์ม (เช่น URL Cloudinary)
    if (typeof payload.imageUrl !== "string") delete payload.imageUrl;
    if (payload.buildingIds && !Array.isArray(payload.buildingIds)){
      payload.buildingIds = [payload.buildingIds];
    }
    const newStadium = new Stadium(payload);
    await newStadium.save();
    res.status(201).json({ message: "Stadium created successfully", stadium: newStadium });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ ดึงข้อมูลทั้งหมด
export const getStadiums = async (_req, res) => {
  try {
    const stadiums = await Stadium.find().sort({ createdAt: -1 });
    res.status(200).json(stadiums);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ อัปเดต Stadium (ไม่ทับ imageUrl ถ้าไม่ได้ส่งมา)
// ✅ อัปเดต Stadium (อนุญาตแก้บางฟิลด์ได้แม้ IsBooking)
export const updateStadium = async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "Stadium not found" });

    const payload = { ...req.body };

    // รองรับ buildingIds ที่ส่งมาเป็นตัวเดียว
    if (payload.buildingIds && !Array.isArray(payload.buildingIds)) {
      payload.buildingIds = [payload.buildingIds];
    }

    // ถ้าไม่ส่ง imageUrl มา ให้คงค่าเดิมไว้
    if (payload.imageUrl === undefined) {
      payload.imageUrl = stadium.imageUrl;
    }

    // ✅ กรณีสนามกำลังถูกจอง: แก้ได้เฉพาะ "ข้อมูลทั่วไป" ที่ไม่กระทบการจอง
    if (stadium.statusStadium === "IsBooking") {
      const allowed = {};
      if (payload.nameStadium !== undefined) allowed.nameStadium = payload.nameStadium;
      if (payload.descriptionStadium !== undefined) allowed.descriptionStadium = payload.descriptionStadium;
      if (payload.contactStadium !== undefined) allowed.contactStadium = payload.contactStadium;

      // อนุญาตเปลี่ยนรูปได้ (ถ้าคุณอยากล็อกรูปด้วย ให้ลบบรรทัดนี้ออก)
      if (payload.imageUrl !== undefined) allowed.imageUrl = payload.imageUrl;

      const updatedStadium = await Stadium.findByIdAndUpdate(req.params.id, allowed, { new: true });
      return res.status(200).json({
        message: "Stadium updated (limited fields) because it is currently booked (IsBooking).",
        stadium: updatedStadium,
      });
    }

    // ✅ กรณีไม่ใช่ IsBooking: แก้ได้ปกติ
    const updatedStadium = await Stadium.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.status(200).json({ message: "Stadium updated successfully", stadium: updatedStadium });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ ลบ Stadium
export const deleteStadium = async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "Stadium not found" });

    if (stadium.statusStadium === "IsBooking") {
      return res.status(400).json({ message: "Cannot delete stadium. Stadium is currently booked (IsBooking)." });
    }

    await Stadium.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Stadium deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getStadiumById = async (req, res) => {
  try{
    const stadium = await Stadium.findById(req.params.id)
     .populate("buildingIds", "name active");

    if (!stadium) return res.status(404).json({ message: "Stadium not found"});

      res.status(200).json(stadium);
  } catch (error) {
    res.status(500).json({ message: "Server error", error});
  }
};
