import Staff from "../models/Stafff.js";
import ExecutiveHistory from "../models/ExecutiveHistory.js";

// ✅ ดึงรายชื่อผู้บริหารทั้งหมด (staff ที่เคยหรือกำลังดำรงตำแหน่ง superadmin)
export const getAllExecutives = async (req, res) => {
  try {
    const executives = await ExecutiveHistory.findAll({
      include: [
        {
          model: Staff,
          as: "staff",
          attributes: ["id", "fullname", "email", "avatarUrl"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(executives)

    res.status(200).json(executives);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ ดึงข้อมูลผู้บริหารคนเดียว
export const getExecutiveById = async (req, res) => {
  try {
    const { id } = req.params;

    const executive = await ExecutiveHistory.findByPk(id, {
      include: [
        {
          model: Staff,
          as: "staff",
          attributes: ["id", "fullname", "email", "avatarUrl"],
        },
      ],
    });

    if (!executive) {
      return res.status(404).json({ message: "Executive not found" });
    }

    res.status(200).json(executive);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ เพิ่มผู้บริหาร (สร้าง ExecutiveHistory record ใหม่ผูกกับ Staff ที่มีอยู่)
export const createExecutive = async (req, res) => {
  try {
    const { staffId, position, phone, startDate, endDate, status } = req.body;

    if (!staffId || !position || !startDate) {
      return res.status(400).json({
        message: "กรุณากรอก staffId, ตำแหน่ง และวันที่เริ่มต้น",
      });
    }

    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({ message: "ไม่พบพนักงาน" });
    }

    const newExecutive = await ExecutiveHistory.create({
      staffId,
      position,
      phone: phone || "",
      startDate,
      endDate: endDate || null,
      status: status || "active",
    });

    // อัปเดต role ของ Staff เป็น superadmin ด้วย
    await staff.update({ role: "superadmin" });

    const result = await ExecutiveHistory.findByPk(newExecutive.id, {
      include: [{ model: Staff, as: "staff", attributes: ["id", "fullname", "email", "avatarUrl"] }],
    });

    res.status(201).json({ message: "เพิ่มผู้บริหารสำเร็จ", executive: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ แก้ไขข้อมูลผู้บริหาร
export const updateExecutive = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, phone, startDate, endDate, status } = req.body;

    const executive = await ExecutiveHistory.findByPk(id);
    if (!executive) {
      return res.status(404).json({ message: "Executive not found" });
    }

    await executive.update({
      position: position ?? executive.position,
      phone: phone ?? executive.phone,
      startDate: startDate ?? executive.startDate,
      endDate: endDate || null,
      status: status ?? executive.status,
    });

    const result = await ExecutiveHistory.findByPk(id, {
      include: [{ model: Staff, as: "staff", attributes: ["id", "fullname", "email", "avatarUrl"] }],
    });

    res.status(200).json({ message: "แก้ไขข้อมูลผู้บริหารสำเร็จ", executive: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ ลบผู้บริหาร (ลบเฉพาะ ExecutiveHistory ไม่ลบ Staff)
export const deleteExecutive = async (req, res) => {
  try {
    const { id } = req.params;

    const executive = await ExecutiveHistory.findByPk(id);
    if (!executive) {
      return res.status(404).json({ message: "Executive not found" });
    }

    await executive.destroy();

    res.status(200).json({ message: "ลบข้อมูลผู้บริหารสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
