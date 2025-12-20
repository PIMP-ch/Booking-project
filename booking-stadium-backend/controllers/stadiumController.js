import Stadium from "../models/Stadium.js";

// ✅ เพิ่ม Stadium
export const createStadium = async (req, res) => {
  try {
    const payload = { ...req.body };
    // รองรับกรณีส่ง imageUrl มาจากฟอร์ม (เช่น URL Cloudinary)
    if (typeof payload.imageUrl !== "string") delete payload.imageUrl;

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
export const updateStadium = async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "Stadium not found" });

    if (stadium.statusStadium === "IsBooking") {
      return res.status(400).json({ message: "Cannot update stadium. Stadium is currently booked (IsBooking)." });
    }

    const payload = { ...req.body };
    if (payload.imageUrl === undefined) {
      // ถ้าไม่ส่ง imageUrl มา ให้คงค่าเดิมไว้
      payload.imageUrl = stadium.imageUrl;
    }

    const updatedStadium = await Stadium.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    );
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
