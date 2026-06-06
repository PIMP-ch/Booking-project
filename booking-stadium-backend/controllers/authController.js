// import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { message } from "hawk/lib/client.js";
import { Op } from "sequelize";
import Userr from "../models/Userr.js";


// ฟังก์ชันสร้างรหัส Reset (ตัวเลข + ตัวอักษรใหญ่ 6 ตัว)
const generateResetToken = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 6; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
};

export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        // const user = await User.findOne({ email });
        const user = await Userr.findOne({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(400).json({ message: "ไม่พบบัญชีที่ใช้ที่อยู่อีเมลนี้ในระบบ" });
        }

        // สร้าง Token สำหรับรีเซ็ตรหัสผ่าน
        const resetToken = generateResetToken();
        // await User.updateOne(
        //     { id: user.id },
        //     {
        //         resetPasswordToken: resetToken,
        //         resetPasswordExpires: Date.now() + 3600000 // Token มีอายุ 1 ชั่วโมง
        //     }
        // );
        await Userr.update(
            {
                resetPasswordToken: resetToken,
                resetPasswordExpires: Date.now() + 3600000 // 1 ชั่วโมง
            },
            {
                where: {
                    id: user.id
                }
            }
        );

        // ตั้งค่า SMTP สำหรับส่งอีเมล
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // **📌 เนื้อหาอีเมล (HTML + CSS)**
        const emailContent = `
            <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); margin: auto;">
                    <h2 style="color: #333333; text-align: center;">🔐 รีเซ็ตรหัสผ่านของคุณ</h2>
                    <p style="color: #666666; text-align: center;">สวัสดี <b>${user.fullname}</b>,</p>
                    <p style="color: #666666; text-align: center;">คุณได้รับอีเมลนี้เนื่องจากคุณร้องขอการรีเซ็ตรหัสผ่านของบัญชีของคุณ</p>

                    <div style="background-color: #ffcc00; color: #333; font-size: 20px; font-weight: bold; text-align: center; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        🔑 รหัสยืนยันของคุณ: <br> <span style="font-size: 24px;">${resetToken}</span>
                    </div>

                    <p style="text-align: center; color: #666666;">โปรดคัดลอกรหัสนี้และนำไปกรอกในหน้าการตั้งค่ารหัสผ่านใหม่</p>
                    <p style="text-align: center; color: #666666;">รหัสนี้มีอายุ <b>1 ชั่วโมง</b> หลังจากนั้นจะไม่สามารถใช้ได้</p>

                    <hr style="border: 0; height: 1px; background-color: #ddd; margin: 20px 0;">
                    
                    <p style="color: #666666; text-align: center;">หากคุณไม่ได้ร้องขอการรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
                    <p style="color: #666666; text-align: center;">ขอบคุณที่ใช้บริการ,</p>
                    <p style="color: #333333; text-align: center; font-weight: bold;">ทีมสนับสนุนลูกค้า</p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Booking-Stadiums Reset Password" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "📌 รีเซ็ตรหัสผ่าน - กรุณายืนยันรหัสของคุณ",
            html: emailContent // ✅ ใช้ HTML แทน text
        });

        res.status(200).json({ message: "รหัสยืนยันถูกส่งไปยังอีเมลของคุณแล้ว" });

    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", error: error.message || String(error) });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // const user = await User.findOne({
        //     resetPasswordToken: token,
        //     resetPasswordExpires: { $gt: Date.now() } // ตรวจสอบว่า Token ยังไม่หมดอายุ
        // });
        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    [Op.gt]: Date.now() // token ต้องยังไม่หมดอายุ
                }
            }
        });

        if (!user) {
            return res.status(400).json({ message: "รหัสยืนยันไม่ถูกต้องหรือหมดอายุ" });
        }

        // ✅ ใช้ `updateOne()` เพื่อแก้ปัญหา ValidationError (phoneNumber is required)
        // await User.updateOne(
        //     { id: user.id },
        //     {
        //         password: newPassword, // ✅ บันทึกรหัสผ่านใหม่โดยตรง (ไม่เข้ารหัส)
        //         resetPasswordToken: null, // ✅ ลบ Token ออก
        //         resetPasswordExpires: null
        //     }
        // );
        await User.update(
            {
                password: newPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            },
            {
                where: {
                    id: user.id
                }
            }
        );

        res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });

    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", error: error.message || String(error) });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        // const { days } = req.body; // ค่าที่รับ: 15, 30, 60

        // // ตรวจสอบค่าที่รับว่าถูกต้องหรือไม่
        // if (![15, 30, 60].includes(days)) {
        //     return res.status(400).json({ message: "ระยะเวลาบล็อกต้องเป็น 15, 30 หรือ 60 วันเท่านั้น" });
        // }

        // คำนวณวันหมดอายุของการบล็อก
        const blockUntil = new Date();
        // blockUntil.setDate(blockUntil.getDate() + days);
        blockUntil.setMinutes(blockUntil.getMinutes() + 5);

        // อัปเดตสถานะผู้ใช้ให้ถูกบล็อก
        // const user = await User.findByIdAndUpdate(id, { blockUntil }, { new: true });
        const user = await Userr.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        }

        await user.update({ blockUntil });

        const now = new Date();
        const diffMs = new Date(user.blockUntil) - now;

        const remainingMinutes = Math.max(0, Math.ceil(diffMs / (1000 * 60)));

        res.status(200).json({
            message: `ผู้ใช้ถูกบล็อกเป็นเวลา ${remainingMinutes} นาที`,
            blockUntil: user.blockUntil
        });

    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", error: error.message || String(error) });
    }
};


export const unblockUser = async (req, res) => {
    try {
        const { id } = req.params;

        // อัปเดตให้ blockUntil เป็น `null`
        // const user = await User.findByIdAndUpdate(id, { blockUntil: null }, { new: true });
        const user = await Userr.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        }

        await user.update({ blockUntil: null });

        res.status(200).json({ message: "ปลดบล็อกผู้ใช้เรียบร้อยแล้ว" });

    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", error: error.message || String(error) });
    }
};



export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, userType, fieldOfStudy, year, department } = req.body;

        if (!fullname || !email || !phoneNumber) {
            return res.status(400).json({ message: "กรุณากรอกชื่อ อีเมล์ เบอร์โทร ให้ครบ" });
        }

        if (!["student", "staff"].includes(userType)) {
            return res.status(400).json({ message: "ประเภทผู้ใช้งานไม่ถูกต้อง (student/staff)" });
        }

        if (userType === "student") {
            if (!fieldOfStudy || !year) {
                return res.status(400).json({ message: "กรุณากรอกสาขาวิชาและชั้นปี" });
            }
        }

        if (userType === "staff") {
            if (!department) {
                return res.status(400).json({ message: "กรุณากรอกหน่วยงาน" });
            }
        }

        // ตรวจสอบอีเมลหรือเบอร์โทรซ้ำ (รวมถึง soft-deleted users)
        const existingUser = await Userr.findOne({
            where: {
                [Op.or]: [{ email }, { phoneNumber }]
            },
            paranoid: false,
        });
        if (existingUser) {
            return res.status(400).json({ message: "Email or phone number already exists" });
        }

        const newUser = await Userr.create({
            fullname,
            email,
            phoneNumber,
            userType,
            fieldOfStudy: userType === "student" ? fieldOfStudy : null,
            year: userType === "student" ? year : null,
            department: userType === "staff" ? department : null,
            status: "NEW",
            blockUntil: null,
        });

        const userResponse = { ...newUser.dataValues };
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: "สมัครสมาชิกสำเร็จ กรุณารอเจ้าหน้าที่อนุมัติบัญชีของคุณ",
            user: userResponse,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message || String(error) });
    }
};



export const login = async (req, res) => {
    try {
        const { email, name, sub } = req.body;
        const user = await Userr.findOne({ where: { email } });

        if (!user) {
            return res.status(200).json({
                message: "ไม่พบอีเมลนี้ในระบบ",
                user: null,
                isNewUser: true,
            });
        }

        // ตรวจสอบ status ก่อนอนุญาตให้เข้าสู่ระบบ
        const statusMessages = {
            NEW:       "บัญชีของคุณสมัครแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติสิทธิ์การใช้งาน",
            Pending:   "บัญชีของคุณอยู่ระหว่างการตรวจสอบข้อมูล กรุณารอการอนุมัติจากเจ้าหน้าที่",
            Suspended: "บัญชีของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อเจ้าหน้าที่",
            Expired:   "บัญชีของคุณหมดอายุแล้ว ไม่สามารถเข้าใช้งานได้",
            Cancelled: "บัญชีของคุณอยู่ระหว่างกระบวนการยกเลิก กรุณาติดต่อเจ้าหน้าที่",
            Rejected:  "คำขอสมัครสมาชิกของคุณไม่ผ่านการตรวจสอบ กรุณาติดต่อเจ้าหน้าที่",
            Deleted:   "บัญชีนี้ถูกลบออกจากระบบแล้ว",
        };

        // Inactive → auto-restore เป็น Active เมื่อ user กลับมา login
        if (user.status === "Inactive") {
            await Userr.update(
                { status: "Active", lastLoginAt: new Date() },
                { where: { id: user.id }, validate: false }
            );
            const restoredUser = await Userr.findByPk(user.id);
            return res.status(200).json({
                message: "ยินดีต้อนรับกลับ! บัญชีของคุณถูกเปิดใช้งานอีกครั้งแล้ว",
                user: restoredUser,
                isNewUser: false,
                wasInactive: true,
            });
        }

        if (user.status !== "Active") {
            return res.status(403).json({
                message: statusMessages[user.status] || "ไม่สามารถเข้าสู่ระบบได้",
                status: user.status,
            });
        }

        if (user.blockUntil && user.blockUntil > new Date()) {
            return res.status(403).json({
                message: `บัญชีของคุณถูกบล็อกจนถึง ${user.blockUntil.toLocaleString()}`,
                status: user.status,
            });
        }

        // บันทึกเวลา login ล่าสุด
        await Userr.update(
            { lastLoginAt: new Date() },
            { where: { id: user.id }, validate: false }
        );
        const freshUser = await Userr.findByPk(user.id);

        return res.status(200).json({
            message: "เข้าสู่ระบบสำเร็จ",
            user: freshUser,
            isNewUser: false,
        });

    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", error: error.message || String(error) });
    }
};




export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Userr.findByPk(id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // soft delete: ตั้ง status เป็น Deleted แล้ว destroy (paranoid จะ set deletedAt)
        await user.update({ status: "Deleted" });
        await user.destroy();

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message || String(error) });
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["NEW", "Pending", "Active", "Suspended", "Expired", "Cancelled", "Rejected", "Deleted"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
        }

        const user = await Userr.findByPk(id);
        if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

        if (status === "Deleted") {
            // ใช้ class method เพื่อข้าม model-level validators
            await Userr.update({ status: "Deleted" }, { where: { id }, validate: false });
            await user.destroy();
            return res.status(200).json({ message: "ลบบัญชีผู้ใช้เรียบร้อยแล้ว" });
        }

        // ใช้ class method เพื่อข้าม model-level validators (studentFieldsRequired ฯลฯ)
        await Userr.update({ status }, { where: { id }, validate: false });

        const updatedUser = await Userr.findByPk(id);
        res.status(200).json({ message: "อัปเดตสถานะสำเร็จ", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message || String(error) });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullname, email, phoneNumber, fieldOfStudy, year } = req.body;

        // ✅ เช็คว่า email หรือ phone ซ้ำกับคนอื่นไหม (ไม่นับตัวเอง)
        const existingUser = await Userr.findOne({
            where: {
                [Op.or]: [{ email }, { phoneNumber }],
                id: { [Op.ne]: id },
            },
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email or phone number already exists" });
        }

        // ✅ อัปเดตก่อน
        await Userr.update(
            { fullname, email, phoneNumber, fieldOfStudy, year },
            { where: { id } }
        );

        // ✅ แล้วค่อย findByPk เพื่อ return ข้อมูลล่าสุด (ใช้ได้ทั้ง MySQL และ PostgreSQL)
        const updatedUser = await Userr.findByPk(id);
        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ message: "User updated successfully", updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


export const getAllUsers = async (req, res) => {
    try {
        const { includeDeleted } = req.query;
        const users = await Userr.findAll({
            paranoid: includeDeleted !== "true", // ถ้าส่ง ?includeDeleted=true จะรวม soft-deleted
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message || String(error) });
    }
};