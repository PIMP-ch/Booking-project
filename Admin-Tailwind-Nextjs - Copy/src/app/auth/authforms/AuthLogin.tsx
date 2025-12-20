"use client";

import { Button, Label, TextInput, Spinner } from "flowbite-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { loginUser } from "@/utils/api";

const AuthLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // เรียก API ล็อกอิน (ควรคืนค่า: { token, staff: { fullname, role, avatarUrl, ... } })
      const res = await loginUser(email, password);

      // เก็บข้อมูลลง localStorage ให้ Header นำไปใช้แสดงรูป/ชื่อ
      if (res?.staff) {
        localStorage.setItem("staffName", res.staff.fullname || "");
        localStorage.setItem("staffAvatar", res.staff.avatarUrl || "");
        localStorage.setItem("staffRole", res.staff.role || "");
      }
      if (res?.token) {
        localStorage.setItem("token", res.token);
      }

      // หน่วงสั้น ๆ เพื่อให้ UX เห็น loading จากปุ่ม
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      console.error("❌ Login Failed:", err);
      setError(err?.message || "เกิดข้อผิดพลาดขณะเข้าสู่ระบบ");
      setLoading(false);
    }
  };

  return (
    <form className="font-kanit" onSubmit={handleLogin}>
      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="email" value="Email" />
        </div>
        <TextInput
          id="email"
          type="email"
          sizing="md"
          className="form-control"
          placeholder="กรอก email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <div className="mb-2 block">
          <Label htmlFor="password" value="Password" />
        </div>
        <TextInput
          id="password"
          type="password"
          sizing="md"
          className="form-control"
          placeholder="กรอกรหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <Button type="submit" color="primary" className="w-full font-kanit" disabled={loading}>
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner size="sm" color="white" />
            กำลังเข้าสู่ระบบ...
          </div>
        ) : (
          "เข้าสู่ระบบ"
        )}
      </Button>
    </form>
  );
};

export default AuthLogin;
