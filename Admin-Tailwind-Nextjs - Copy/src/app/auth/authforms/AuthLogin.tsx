"use client";

import { Button, Label, TextInput, Spinner } from "flowbite-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { loginUser } from "@/utils/api";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

const AuthLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="กรอกรหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            tabIndex={-1}
          >
            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        </div>
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