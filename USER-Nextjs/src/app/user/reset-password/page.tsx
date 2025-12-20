"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { resetPasswordRequest, resetPassword } from "@/utils/api";

const ResetPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = ขอรหัส, 2 = กรอก Token + Password
  const [loading, setLoading] = useState(false);

  // ✅ ส่งคำขอรีเซ็ตรหัสผ่าน
  const handleRequestReset = async () => {
    setLoading(true);
    try {
      const response = await resetPasswordRequest(email);
      toast.success(response.message || "รหัสยืนยันถูกส่งไปที่อีเมลของคุณ");
      setStep(2);
    } catch (error: any) {
      if (error.status === 400) {
        toast.error("❌ ไม่พบบัญชีที่ใช้อีเมลนี้ในระบบ");
      } else {
        toast.error("❌ ไม่พบบัญชีที่ใช้อีเมลนี้ในระบบ");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ รีเซ็ตรหัสผ่านใหม่
  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const response = await resetPassword(token, newPassword);
      toast.success(response.message || "เปลี่ยนรหัสผ่านสำเร็จ!");
      router.push("/user/login");
    } catch (error: any) {
      if (error.status === 400) {
        toast.error("❌ รหัสยืนยันไม่ถูกต้องหรือหมดอายุ");
      } else {
        toast.error("❌ ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center p-2 bg-gray-100 font-kanit">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">รีเซ็ตรหัสผ่าน</h2>

        {step === 1 ? (
          <>
            <p className="text-gray-600 text-center mb-4">กรอกอีเมลของคุณเพื่อรับรหัสยืนยัน</p>
            <input
              type="email"
              className="w-full p-3 border rounded mb-4"
              placeholder="กรอกอีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              className="w-full bg-orange-500 text-white py-3 rounded-lg"
              onClick={handleRequestReset}
              disabled={loading}
            >
              {loading ? "กำลังส่ง..." : "ส่งรหัสยืนยัน"}
            </button>
          </>
        ) : (
          <>
            <input type="text" className="w-full p-3 border rounded mb-4" placeholder="รหัสยืนยัน" value={token} onChange={(e) => setToken(e.target.value)} required />
            <input type="password" className="w-full p-3 border rounded mb-4" placeholder="รหัสผ่านใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button className="w-full bg-green-500 text-white py-3 rounded-lg" onClick={handleResetPassword} disabled={loading}>
              {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
