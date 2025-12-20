import express from "express";
import { 
    register,
    login,
    deleteUser,
    updateUser,
    getAllUsers,
    blockUser,
    unblockUser,
    requestPasswordReset,
    resetPassword  } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/AllUser", getAllUsers); // Fetch all registered users
// ✅ Route สำหรับลบผู้ใช้
router.delete("/:id", deleteUser);

// ✅ Route สำหรับแก้ไขผู้ใช้
router.put("/:id", updateUser);

// ✅ บล็อกผู้ใช้
router.put("/block-user/:id", blockUser);

// ✅ ปลดบล็อกผู้ใช้
router.put("/unblock-user/:id", unblockUser);


// ✅ ขอ Reset Password
router.post("/reset-password/request", requestPasswordReset);

// ✅ ตั้งค่ารหัสผ่านใหม่
router.post("/reset-password", resetPassword);



export default router;
