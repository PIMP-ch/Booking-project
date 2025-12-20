"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "@/utils/api";
import { toast } from "react-toastify";
import useAuth from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cred, setCred] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCred({ ...cred, [e.target.name]: e.target.value });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const email = cred.email.trim().toLowerCase();
      const res = await loginUser(email, cred.password);
      login?.(res.user);
      toast.success(res?.message || "เข้าสู่ระบบสำเร็จ");
      router.push("/home");
    } catch (err: any) {
      const msg = err?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      toast.error(msg); // ✅ แสดงเฉพาะ Toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full">
      {/* ✅ พื้นหลังรูปเต็มจอ */}
      <div className="absolute inset-0 w-full h-full bg-[url('/images/backgrounds/bg-football-stadium.png')] bg-no-repeat bg-cover bg-center" />

      {/* ✅ เลเยอร์ดำโปร่ง */}
      <div className="absolute inset-0 bg-black/60" />

      {/* ฟอร์ม Login */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl bg-black/60 backdrop-blur-sm p-6 text-white shadow-2xl"
        >
          <h2 className="text-3xl font-extrabold text-center mb-1">
            เข้าสู่ระบบ
          </h2>
          <p className="text-center text-gray-300 text-sm mb-6">
            กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ
          </p>

          <label className="block text-sm mb-1">อีเมล</label>
          <input
            type="email"
            name="email"
            value={cred.email}
            onChange={handleChange}
            placeholder="กรอกอีเมลของคุณ"
            className="w-full p-4 rounded-lg bg-white/95 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            required
          />

          <label className="block text-sm mb-1">รหัสผ่าน</label>
          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={cred.password}
              onChange={handleChange}
              placeholder="กรอกรหัสผ่านของคุณ"
              className="w-full p-4 pr-12 rounded-lg bg-white/95 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 transition-colors text-white py-3 rounded-xl font-semibold disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          <div className="mt-4 text-center space-y-2 text-sm">
            <Link
              href="/user/reset-password"
              className="text-yellow-300 hover:underline font-semibold"
            >
              ลืมรหัสผ่าน?
            </Link>
            <p className="text-gray-200">
              ถ้ายังไม่มีบัญชี?{" "}
              <Link
                href="/user/register"
                className="text-blue-300 hover:underline font-semibold"
              >
                คลิกที่นี่
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
