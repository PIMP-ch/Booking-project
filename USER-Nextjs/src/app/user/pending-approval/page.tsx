"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock, XCircle, ShieldOff, AlertCircle, Ban, Moon } from "lucide-react";

type StatusConfig = {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
};

const statusConfigs: Record<string, StatusConfig> = {
  NEW: {
    icon: <Clock size={56} className="text-yellow-400" />,
    title: "รอการตรวจสอบสิทธิ์",
    description:
      "บัญชีของคุณถูกบันทึกเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติสิทธิ์การใช้งาน เมื่อได้รับการอนุมัติแล้วคุณจึงจะสามารถเข้าสู่ระบบได้",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
  },
  Pending: {
    icon: <Clock size={56} className="text-blue-400" />,
    title: "อยู่ระหว่างการตรวจสอบ",
    description:
      "บัญชีของคุณอยู่ระหว่างการตรวจสอบข้อมูลจากเจ้าหน้าที่ กรุณารอการอนุมัติ ระบบจะแจ้งให้ทราบเมื่อดำเนินการเสร็จสิ้น",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
  },
  Suspended: {
    icon: <ShieldOff size={56} className="text-orange-400" />,
    title: "บัญชีถูกระงับการใช้งาน",
    description:
      "บัญชีของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามรายละเอียดเพิ่มเติม",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/30",
  },
  Expired: {
    icon: <AlertCircle size={56} className="text-gray-400" />,
    title: "บัญชีหมดอายุ",
    description:
      "บัญชีของคุณหมดอายุแล้ว (สำเร็จการศึกษา) ไม่สามารถเข้าใช้งานระบบได้อีก หากมีข้อสงสัยกรุณาติดต่อเจ้าหน้าที่",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10 border-gray-500/30",
  },
  Cancelled: {
    icon: <Ban size={56} className="text-purple-400" />,
    title: "อยู่ระหว่างยกเลิกสมาชิก",
    description:
      "บัญชีของคุณอยู่ระหว่างกระบวนการยกเลิกสมาชิก หากต้องการยกเลิกคำขอดังกล่าว กรุณาติดต่อเจ้าหน้าที่",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/30",
  },
  Rejected: {
    icon: <XCircle size={56} className="text-red-400" />,
    title: "ไม่ผ่านการอนุมัติ",
    description:
      "คำขอสมัครสมาชิกของคุณไม่ผ่านการตรวจสอบ กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามเหตุผลและขั้นตอนการดำเนินการต่อไป",
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/30",
  },
  Inactive: {
    icon: <Moon size={56} className="text-indigo-400" />,
    title: "บัญชีไม่ได้ใช้งานเป็นเวลานาน",
    description:
      "บัญชีของคุณถูกตั้งเป็น Inactive เนื่องจากไม่ได้เข้าสู่ระบบเป็นเวลานาน กรุณาเข้าสู่ระบบอีกครั้งเพื่อเปิดใช้งานบัญชีของคุณโดยอัตโนมัติ",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10 border-indigo-500/30",
  },
};

const defaultConfig: StatusConfig = {
  icon: <AlertCircle size={56} className="text-gray-400" />,
  title: "ไม่สามารถเข้าสู่ระบบได้",
  description: "กรุณาติดต่อเจ้าหน้าที่เพื่อขอความช่วยเหลือ",
  color: "text-gray-400",
  bgColor: "bg-gray-500/10 border-gray-500/30",
};

export default function PendingApprovalPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "";
  const config = statusConfigs[status] || defaultConfig;

  return (
    <main className="relative min-h-screen w-full font-kanit">
      <div className="absolute inset-0 w-full h-full bg-[url('/images/backgrounds/bg-football-stadium.png')] bg-no-repeat bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-black/60 backdrop-blur-sm p-8 text-white shadow-2xl text-center">

          <div className="flex justify-center mb-5">{config.icon}</div>

          <h1 className={`text-2xl font-bold mb-3 ${config.color}`}>
            {config.title}
          </h1>

          <div className={`rounded-xl border p-4 mb-6 ${config.bgColor}`}>
            <p className="text-sm text-gray-200 leading-relaxed">
              {config.description}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/user/login"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
