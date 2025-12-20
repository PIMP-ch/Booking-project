import fs from "fs";
import path from "path";
import Equipment from "../models/Equipment.js";

// ✅ เพิ่มอุปกรณ์ใหม่
export const createEquipment = async (req, res) => {
    try {
        const newEquipment = new Equipment(req.body);
        await newEquipment.save();
        res.status(201).json({ message: "Equipment added successfully", newEquipment });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ แก้ไขอุปกรณ์
export const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, quantity, status, imageUrl } = req.body;

        const payload = { name, quantity, status };
        if (typeof imageUrl !== "undefined") {
            payload.imageUrl = imageUrl;
        }

        const updatedEquipment = await Equipment.findByIdAndUpdate(
            id,
            payload,
            { new: true, runValidators: true }
        );

        if (!updatedEquipment) {
            return res.status(404).json({ message: "Equipment not found" });
        }

        res.status(200).json({ message: "Equipment updated successfully", updatedEquipment });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ดึงข้อมูลอุปกรณ์ทั้งหมด
export const getEquipments = async (req, res) => {
    try {
        const equipments = await Equipment.find();
        res.status(200).json(equipments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ลบอุปกรณ์
export const deleteEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) {
            return res.status(404).json({ message: "Equipment not found" });
        }

        if (equipment.imageUrl) {
            const relative = equipment.imageUrl.replace(/^[\\/]/, "");
            const filePath = path.join(process.cwd(), relative);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await equipment.deleteOne();
        res.status(200).json({ message: "Equipment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
