"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/utils/api";
import { toast } from "react-toastify";
import useAuth from "@/hooks/useAuth";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // ✅ รับ email เป็น parameter แทน event
  const handleLogin = async (email: string, name: string, sub: string) => {
    setLoading(true);
    try {
      const res = await loginUser(email, name, sub);
      if (res.isNewUser) {
        toast.info("ไม่พบข้อมูลผู้ใช้ กำลังพาคุณไปหน้าสมัครสมาชิก");
        router.push(`/user/register?email=${email}&name=${name}`);
        return;
      }
      login?.(res.user);
      toast.success(res?.message || "เข้าสู่ระบบสำเร็จ");
      router.push("/home");
    } catch (err: any) {
      const msg = err?.message || "เข้าสู่ระบบไม่สำเร็จ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full">
      <div className="absolute inset-0 w-full h-full bg-[url('/images/backgrounds/bg-football-stadium.png')] bg-no-repeat bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-black/60 backdrop-blur-sm p-6 text-white shadow-2xl">
          <h2 className="text-3xl font-extrabold text-center text-white mb-5">
            เข้าสู่ระบบ
          </h2>

          <GoogleOAuthProvider clientId="{ใส่ client id}">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                // ✅ decode อยู่ใน scope ที่ถูกต้อง + type กำหนดให้ชัด
                const decoded = jwtDecode<{ email: string }>(
                  credentialResponse?.credential!
                );
                handleLogin(decoded.email, decoded.name, decoded.sub);
              }}
              onError={() => {
                toast.error("เข้าสู่ระบบไม่สำเร็จ");
              }}
            />
          </GoogleOAuthProvider>
        </div>
      </div>
    </main>
  );
}