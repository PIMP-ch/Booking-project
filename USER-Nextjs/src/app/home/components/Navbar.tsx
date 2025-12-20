"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const Navbar = () => {
    const { user, logout } = useAuth();
    const router = useRouter();

    // ✅ ดึงชื่อวันปัจจุบันในภาษาไทย
    const today = new Intl.DateTimeFormat("th-TH", { weekday: "long" }).format(new Date());

    return (
        <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 p-4 flex items-center justify-between rounded-b-lg pb-2 max-w-[670px] mx-auto">
            {/* โปรไฟล์ผู้ใช้ */}
            <div className="flex items-center gap-3 ml-5">
                <div>
                    <h2 className="text-lg font-bold">{user?.fullname || "Guest"}</h2>
                    <p className="text-sm text-gray-500">สวัสดีวัน{today}</p>
                </div>
            </div>

            {/* ปุ่ม Logout */}
            <button
                onClick={() => {
                    logout();
                    router.push("/user/login");
                }}
                className="p-3 rounded-full border border-orange-600 hover:bg-orange-100 transition"
            >
                <LogOut className="text-red-500" size={20} />
            </button>
        </div>
    );
};

export default Navbar;
