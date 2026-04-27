import Staff from "../models/Stafff.js";
import ExecutiveHistory from "../models/ExecutiveHistory.js";

// ✅ Login Staff (ไม่ใช้ bcrypt/jwt)
export const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await Staff.findOne({ where: { email } });
    if (!staff) return res.status(400).json({ message: "Invalid email or password" });

    if (password !== staff.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    return res.status(200).json({
      message: "Login successful",
      staff: {
        id: staff.id,
        fullname: staff.fullname,
        email: staff.email,
        role: staff.role,
        avatarUrl: staff.avatarUrl || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ สร้างพนักงานใหม่
export const createStaff = async (req, res) => {
  try {
    const { fullname, email, role, password, startDate, endDate } = req.body;

    // ตรวจสอบอีเมลซ้ำ
    const existingStaff = await Staff.findOne({ where: { email } });
    if (existingStaff) return res.status(400).json({ message: "Email already exists" });

    // ตรวจสอบว่าถ้าเป็น superadmin ต้องมีวันที่
    if (role === "superadmin" && !startDate) {
      return res.status(400).json({ message: "กรุณาระบุวันที่เริ่มดำรงตำแหน่ง" });
    }

    // สร้างพนักงาน
    const newStaff = await Staff.create({ fullname, email, role, password });

    // ✅ ถ้าเป็น superadmin -> บันทึกประวัติผู้บริหารด้วย
    if (role === "superadmin") {
      await ExecutiveHistory.create({
        staffId: newStaff.id,
        startDate,
        endDate: endDate || null,
      });
    }

    res.status(201).json({ message: "Staff created successfully", newStaff });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ ลบพนักงาน
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    await staff.destroy();

    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ แก้ไขข้อมูลพนักงาน
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, role, startDate, endDate } = req.body;

    const staff = await Staff.findByPk(id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // ตรวจสอบว่าถ้าเปลี่ยนเป็น superadmin ต้องมีวันที่
    if (role === "superadmin" && !startDate) {
      return res.status(400).json({ message: "กรุณาระบุวันที่เริ่มดำรงตำแหน่ง" });
    }

    // อัปเดตข้อมูล staff
    await staff.update({ fullname, email, role });

    if (role === "superadmin") {
      // ค้นหาประวัติล่าสุดของ staff คนนี้
      const existingHistory = await ExecutiveHistory.findOne({
        where: { staffId: id },
        order: [["createdAt", "DESC"]], // เอาอันล่าสุด
      });

      if (existingHistory) {
        // ✅ อัปเดตประวัติที่มีอยู่
        await existingHistory.update({ startDate, endDate: endDate || null });
      } else {
        // ✅ ยังไม่มีประวัติ -> สร้างใหม่
        await ExecutiveHistory.create({
          staffId: id,
          startDate,
          endDate: endDate || null,
        });
      }
    }

    res.status(200).json({ message: "Staff updated successfully", staff });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ ดูข้อมูลพนักงานทั้งหมด
export const getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.findAll();
    res.status(200).json(staffList);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
