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
      const res = await loginUser(email, password);

      // ✅ รวมเป็น user object ตัวเดียว (สำคัญมาก)
      if (res?.staff) {
        const user = {
          id: res.staff.id,
          fullname: res.staff.fullname,
          role: res.staff.role,
          avatar: res.staff.avatarUrl || "",
        };

        // 👉 ใช้ sessionStorage (ตรงกับ Sidebar)
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("staffName", res.staff.fullname || "");
        localStorage.setItem("staffAvatar", res.staff.avatarUrl || "");


        // (optional) เผื่อที่อื่นยังใช้ localStorage
        localStorage.setItem("token", res.token || "");
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);

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
          placeholder="กรอกรหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <Button type="submit" color="blue" className="w-full" disabled={loading}>
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
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