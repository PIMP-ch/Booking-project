import express from "express";
import {
    register,
    login,
    deleteUser,
    updateUser,
    updateUserStatus,
    getAllUsers,
    blockUser,
    unblockUser,
    requestPasswordReset,
    resetPassword  } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/AllUser", getAllUsers);

// ✅ ขอ Reset Password
router.post("/reset-password/request", requestPasswordReset);
router.post("/reset-password", resetPassword);

// ✅ specific routes ต้องมาก่อน /:id
router.put("/block-user/:id", blockUser);
router.put("/unblock-user/:id", unblockUser);
router.put("/update-status/:id", updateUserStatus);

// ✅ generic /:id
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);



export default router;
