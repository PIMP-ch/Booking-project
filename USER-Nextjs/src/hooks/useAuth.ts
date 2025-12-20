"use client"; // ✅ บังคับให้ใช้ใน Client Component

import { useState, useEffect } from "react";

interface User {
    _id: string;
    fullname: string;
    email: string;
    phoneNumber: string;
    fieldOfStudy: string;
    year: number;
    token: string;
}

export default function useAuth() {
    const [user, setUser] = useState<User | null>(null);

    // ✅ โหลดข้อมูลจาก LocalStorage เมื่อ Component Mount
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser !== null && storedUser !== "undefined") {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("❌ Error parsing user JSON:", error);
                localStorage.removeItem("user"); // 🛠 ลบข้อมูลที่เสียหายออก
            }
        }
    }, []);

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    // ✅ ฟังก์ชัน Login (บันทึกข้อมูลลง LocalStorage)
    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    // ✅ ฟังก์ชัน Logout (ล้าง LocalStorage)
    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return { user, login, updateUser, logout };
}
