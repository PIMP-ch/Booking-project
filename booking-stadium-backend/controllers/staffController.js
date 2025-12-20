import Staff from "../models/Staff.js";

// ✅ Login Staff (ไม่ใช้ bcrypt/jwt)
export const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ค้นหา Staff จากอีเมล
    const staff = await Staff.findOne({ email });
    if (!staff) return res.status(400).json({ message: "Invalid email or password" });

    // ตรวจสอบรหัสผ่าน (เปรียบเทียบแบบตรง)
    if (password !== staff.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ Login สำเร็จ -> ส่งกลับ staff พร้อม avatarUrl
    return res.status(200).json({
      message: "Login successful",
      staff: {
        _id: staff._id,
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
    const { fullname, email, role, password } = req.body;

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) return res.status(400).json({ message: "Email already exists" });

    // สร้างพนักงานใหม่
    const newStaff = new Staff({ fullname, email, role, password });
    await newStaff.save();

    res.status(201).json({ message: "Staff created successfully", newStaff });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ ลบพนักงาน
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStaff = await Staff.findByIdAndDelete(id);
    if (!deletedStaff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ แก้ไขข้อมูลพนักงาน
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, role } = req.body;

    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      { fullname, email, role },
      { new: true, runValidators: true }
    );

    if (!updatedStaff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json({ message: "Staff updated successfully", updatedStaff });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ ดูข้อมูลพนักงานทั้งหมด
export const getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find();
    res.status(200).json(staffList);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
