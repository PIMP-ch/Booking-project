import Stadium from "../models/Stadium.js";
import fs from "fs";
import path from "path";

// ✅ 1. เพิ่ม Stadium พร้อมรองรับการอัปโหลดรูปภาพหลายรูป
export const createStadium = async (req, res) => {
  try {
    const payload = { ...req.body };

    // ถ้ามีการอัปโหลดไฟล์ผ่าน Multer (req.files) ให้เก็บ path ลงใน imageUrl
    if (req.files && req.files.length > 0) {
      payload.imageUrl = req.files.map(file => `/uploads/${file.filename}`);
    } else {
      payload.imageUrl = []; // ถ้าไม่มีรูปให้เป็น Array ว่าง
    }

    if (payload.buildingIds && !Array.isArray(payload.buildingIds)) {
      payload.buildingIds = [payload.buildingIds];
    }

    const newStadium = new Stadium(payload);
    await newStadium.save();
    res.status(201).json({ message: "Stadium created successfully", stadium: newStadium });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ 2. เพิ่มรูปภาพใหม่เข้าไปในรายการเดิม (สำหรับหน้าแก้ไขรูปภาพใน Admin)
export const addStadiumImages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);

    // ใช้ $push เพื่อเพิ่มข้อมูลใหม่เข้าไปใน Array เดิมที่มีอยู่
    const stadium = await Stadium.findByIdAndUpdate(
      id,
      { $push: { imageUrl: { $each: newImagePaths } } },
      { new: true }
    );

    if (!stadium) return res.status(404).json({ message: "Stadium not found" });

    res.status(200).json({ message: "Images added successfully", stadium });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error });
  }
};

// ✅ 3. ลบรูปภาพทีละรูป (ลบไฟล์ในเครื่อง + ลบใน Database)
export const deleteStadiumImage = async (req, res) => {
  try {
    const { id, index } = req.params;
    const stadium = await Stadium.findById(id);

    if (!stadium || !stadium.imageUrl[index]) {
      return res.status(404).json({ message: "Image not found" });
    }

    // ลบไฟล์จริงในเครื่อง (ใช้ path.join เพื่อหาที่อยู่ไฟล์)
    const fileName = stadium.imageUrl[index];
    const filePath = path.join(process.cwd(), fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // ลบ Path ออกจาก Array ใน Database
    stadium.imageUrl.splice(index, 1);
    await stadium.save();

    res.status(200).json({ message: "Image deleted successfully", stadium });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};

// ✅ 4. อัปเดตข้อมูลทั่วไป (รองรับกรณี IsBooking)
export const updateStadium = async (req, res) => {
  try {
    const { id } = req.params;
    const stadium = await Stadium.findById(id);
    if (!stadium) return res.status(404).json({ message: "ไม่พบข้อมูลสนาม" });

    const payload = { ...req.body };

    // ✅ ตรวจสอบและแปลง buildingIds ให้เป็น Array เสมอ
    if (payload.buildingIds) {
      payload.buildingIds = Array.isArray(payload.buildingIds) 
        ? payload.buildingIds 
        : [payload.buildingIds];
    }

    // ✅ กรณีสนามถูกจอง (IsBooking): ล็อกฟิลด์สำคัญ แต่ให้แก้ชื่อ/คำอธิบายได้
    if (stadium.statusStadium === "IsBooking") {
      const allowedData = {
        nameStadium: payload.nameStadium || stadium.nameStadium,
        descriptionStadium: payload.descriptionStadium || stadium.descriptionStadium,
        contactStadium: payload.contactStadium || stadium.contactStadium,
      };
      
      const updated = await Stadium.findByIdAndUpdate(id, allowedData, { new: true });
      return res.status(200).json({ message: "อัปเดตข้อมูลทั่วไปสำเร็จ (สถานะจองอยู่)", stadium: updated });
    }

    // ✅ กรณีปกติ: อัปเดตได้ทุกฟิลด์
    const updatedStadium = await Stadium.findByIdAndUpdate(id, payload, { new: true });
    res.status(200).json({ message: "บันทึกการแก้ไขสำเร็จ", stadium: updatedStadium });

  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึก", error: error.message });
  }
};

// ✅ 5. ดึงข้อมูลทั้งหมด
export const getStadiums = async (_req, res) => {
  try {
    const stadiums = await Stadium.find().sort({ createdAt: -1 });
    res.status(200).json(stadiums);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ 6. ดึงข้อมูลตาม ID
export const getStadiumById = async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id).populate("buildingIds", "name active");
    if (!stadium) return res.status(404).json({ message: "Stadium not found" });
    res.status(200).json(stadium);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ 7. ลบ Stadium ทิ้งทั้งหมด
export const deleteStadium = async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) return res.status(404).json({ message: "Stadium not found" });

    if (stadium.statusStadium === "IsBooking") {
      return res.status(400).json({ message: "Cannot delete stadium under booking status" });
    }

    // ลบรูปภาพทั้งหมดที่เกี่ยวข้องใน Folder ทิ้งก่อนลบ Data
    stadium.imageUrl.forEach(imgPath => {
      const filePath = path.join(process.cwd(), imgPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await Stadium.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Stadium and its images deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};