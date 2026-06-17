"use client";

import React, { useEffect, useState } from "react";
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
  const [clientId, setClientId] = useState("")

  const handleLogin = async (email: string, name: string, sub: string) => {
    if (!email.toLowerCase().endsWith("@kmutnb.ac.th")) {
      toast.error("email ต้องเป็นของมหาวิทยาลัยเท่านั้น");
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser(email, name, sub);
      if (res.isNewUser) {
        toast.info("ไม่พบข้อมูลผู้ใช้ กำลังพาคุณไปหน้าสมัครสมาชิก");
        router.push(`/user/register?email=${email}&name=${name}`);
        return;
      }
      login?.(res.user);
      if (res.wasInactive) {
        toast.info(res.message || "ยินดีต้อนรับกลับ! บัญชีของคุณถูกเปิดใช้งานอีกครั้งแล้ว");
      } else {
        toast.success(res?.message || "เข้าสู่ระบบสำเร็จ");
      }
      router.push("/home");
    } catch (err: any) {
      const status = err?.status as string | undefined;
      const pendingStatuses = ["NEW", "Pending"];
      if (status && pendingStatuses.includes(status)) {
        toast.info(err?.message || "บัญชีของคุณรอการอนุมัติ");
        router.push(`/user/pending-approval?status=${status}`);
      } else {
        toast.error(err?.message || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  })

  return (
    <main className="relative min-h-screen w-full">
      <div className="absolute inset-0 w-full h-full bg-[url('/images/backgrounds/bg-football-stadium.png')] bg-no-repeat bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-black/60 backdrop-blur-sm p-6 text-white shadow-2xl">
          <h2 className="text-3xl font-extrabold text-center text-white mb-5">
            เข้าสู่ระบบ
          </h2>

          <GoogleOAuthProvider clientId={clientId}>
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
    </main >
  );
}