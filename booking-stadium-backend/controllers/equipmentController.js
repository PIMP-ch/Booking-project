import fs from "fs";
import path from "path";
import Equipment from "../models/Equipmentt.js";
import EquipmentAdjustmentTransaction from "../models/EquipmentAdjustmentTransaction.js";

// ✅ เพิ่มอุปกรณ์ใหม่
export const createEquipment = async (req, res) => {
    try {
        const existing = await Equipment.findOne({ where: { name: req.body.name } });
        if (existing) {
            return res.status(400).json({ message: "มีอุปกรณ์ชื่อนี้อยู่แล้ว" });
        }
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
        const { name, brand, size, quantity, status, imageUrl, sportTypeId } = req.body;

        if (name) {
            const dup = await Equipment.findOne({ where: { name } });
            if (dup && String(dup.id) !== String(id)) {
                return res.status(400).json({ message: "มีอุปกรณ์ชื่อนี้อยู่แล้ว" });
            }
        }

        const updatedEquipment = await Equipment.findByPk(id);
        if (!updatedEquipment) {
            return res.status(404).json({ message: "Equipment not found" });
        }

        const payload = { name, brand, size, quantity, status, sportTypeId };
        if (typeof imageUrl !== "undefined") {
            payload.imageUrl = imageUrl;
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
        const equipments = await Equipment.findAll();
        res.status(200).json(equipments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ ลบอุปกรณ์
export const deleteEquipment = async (req, res) => {
    try {
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

        await equipment.destroy();
        res.status(200).json({ message: "Equipment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ รับเข้า / จำหน่ายออก อุปกรณ์
export const adjustEquipmentStock = async (req, res) => {
    try {
        const { equipmentId, type, quantity, note, reason } = req.body;

        if (!equipmentId || !type || !quantity) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        if (!["in", "out"].includes(type)) {
            return res.status(400).json({ message: "ประเภทต้องเป็น in หรือ out เท่านั้น" });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: "จำนวนต้องมากกว่า 0" });
        }

        const equipment = await Equipment.findByPk(equipmentId);
        if (!equipment) {
            return res.status(404).json({ message: "ไม่พบอุปกรณ์" });
        }

        if (type === "out" && equipment.quantity < quantity) {
            return res.status(400).json({
                message: `จำนวนจำหน่ายออกเกินจำนวนคงเหลือ (คงเหลือ: ${equipment.quantity})`,
            });
        }

        const newQuantity =
            type === "in"
                ? equipment.quantity + quantity
                : equipment.quantity - quantity;

        await equipment.update({ quantity: newQuantity });

        const autoReason = reason || (type === "in" ? "normal_in" : "normal_out");

        const transaction = await EquipmentAdjustmentTransaction.create({
            equipmentId,
            type,
            quantity,
            note: note || null,
            reason: autoReason,
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
        const [transactions, equipments] = await Promise.all([
            EquipmentAdjustmentTransaction.findAll({ order: [["createdAt", "DESC"]] }),
            Equipment.findAll({ attributes: ["id", "name"] }),
        ]);

        const equipMap = {};
        equipments.forEach(eq => {
            if (eq.name) equipMap[eq.id] = eq.name;
        });

        const result = transactions.map(tx => ({
            ...tx.toJSON(),
            equipmentName: equipMap[tx.equipmentId] || null,
        }));

        res.status(200).json(result);
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
