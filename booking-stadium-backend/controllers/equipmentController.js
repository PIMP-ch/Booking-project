import fs from "fs";
import path from "path";
import Equipment from "../models/Equipmentt.js";
import EquipmentAdjustmentTransaction from "../models/EquipmentAdjustmentTransaction.js";

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
        const { name, quantity, status, imageUrl, sportTypeId } = req.body;

        const payload = { name, quantity, status, sportTypeId };
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

// ✅ รับเข้า / จำหน่ายออก อุปกรณ์
export const adjustEquipmentStock = async (req, res) => {
    try {
        const { equipmentId, type, quantity, note } = req.body;

        // Validate required fields
        if (!equipmentId || !type || !quantity) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        if (!["in", "out"].includes(type)) {
            return res.status(400).json({ message: "ประเภทต้องเป็น in หรือ out เท่านั้น" });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: "จำนวนต้องมากกว่า 0" });
        }

        // Find equipment
        const equipment = await Equipment.findByPk(equipmentId);
        if (!equipment) {
            return res.status(404).json({ message: "ไม่พบอุปกรณ์" });
        }

        // Validate stock for "out"
        if (type === "out" && equipment.quantity < quantity) {
            return res.status(400).json({
                message: `จำนวนจำหน่ายออกเกินจำนวนคงเหลือ (คงเหลือ: ${equipment.quantity})`,
            });
        }

        // Calculate new quantity
        const newQuantity =
            type === "in"
                ? equipment.quantity + quantity
                : equipment.quantity - quantity;

        // Update equipment quantity
        await equipment.update({ quantity: newQuantity });

        // Create transaction record
        const transaction = await EquipmentAdjustmentTransaction.create({
            equipmentId,
            type,
            quantity,
            note: note || null,
        });

        res.status(201).json({
            message: type === "in" ? "รับเข้าอุปกรณ์สำเร็จ" : "จำหน่ายออกอุปกรณ์สำเร็จ",
            transaction,
            updatedQuantity: newQuantity,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ดึงประวัติการรับเข้า/จำหน่ายออกทั้งหมด
export const getAdjustmentTransactions = async (req, res) => {
    try {
        const transactions = await EquipmentAdjustmentTransaction.findAll({
            include: [
                {
                    model: Equipment,
                    as: "equipment",
                    attributes: ["id", "name", "quantity"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ดึงประวัติของอุปกรณ์ชิ้นนั้นๆ
export const getTransactionsByEquipment = async (req, res) => {
    try {
        const { equipmentId } = req.params;

        const equipment = await Equipment.findByPk(equipmentId);
        if (!equipment) {
            return res.status(404).json({ message: "ไม่พบอุปกรณ์" });
        }

        const transactions = await EquipmentAdjustmentTransaction.findAll({
            where: { equipmentId },
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json({ equipment, transactions });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
