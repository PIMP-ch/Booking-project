import fs from "fs";
import path from "path";
import Equipment from "../models/Equipmentt.js";

// ✅ เพิ่มอุปกรณ์ใหม่
export const createEquipment = async (req, res) => {
    try {
        const newEquipment = await Equipment.create(req.body);
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

        // const updatedEquipment = await Equipment.findByIdAndUpdate(
        //     id,
        //     payload,
        //     { new: true, runValidators: true }
        // );
        const updatedEquipment = await Equipment.findByPk(id);

        if (!updatedEquipment) {
            return res.status(404).json({ message: "Equipment not found" });
        }

        await updatedEquipment.update(payload);


        res.status(200).json({ message: "Equipment updated successfully", updatedEquipment });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ดึงข้อมูลอุปกรณ์ทั้งหมด
export const getEquipments = async (req, res) => {
    try {
        // const equipments = await Equipment.find();
        const equipments = await Equipment.findAll();
        res.status(200).json(equipments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ลบอุปกรณ์
export const deleteEquipment = async (req, res) => {
    try {
        // const equipment = await Equipment.findById(req.params.id);
        const equipment = await Equipment.findByPk(req.params.id);
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

        // await equipment.deleteOne();
        await equipment.destroy();
        res.status(200).json({ message: "Equipment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
