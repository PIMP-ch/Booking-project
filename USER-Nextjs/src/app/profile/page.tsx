"use client";

import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { updateUser } from "@/utils/api";
import { toast } from "react-toastify";
import { User, Mail, BookOpen, Calendar, Phone } from "lucide-react"; // ✅ เพิ่ม Icon

const ProfilePage = () => {
    const { user, updateUser: updateLocalUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        _id: "",
        fullname: "",
        email: "",
        phoneNumber: "", // ✅ เพิ่ม `phoneNumber`
        fieldOfStudy: "",
        year: 0,
    });

    // ✅ ดึงข้อมูลผู้ใช้จาก `user` และตั้งค่าใน `formData`
    useEffect(() => {
        if (user) {
            setFormData({
                _id: user._id || "",
                fullname: user.fullname || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "", // ✅ ตั้งค่าเบอร์โทร
                fieldOfStudy: user.fieldOfStudy || "",
                year: user.year || 0,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            if (!formData._id) {
                toast.error("ไม่พบ ID ของผู้ใช้");
                return;
            }

            const updatedUser = await updateUser(formData._id, formData); // ✅ ส่ง `phoneNumber` ไป Backend
            updateLocalUser(updatedUser.updatedUser); // ✅ อัปเดต LocalStorage
            setIsEditing(false);
            toast.success("บันทึกข้อมูลสำเร็จ!");
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    return (
        <div className="h-[100vh] overflow-y-auto">
            <div className="p-6 max-w-md mx-auto bg-white rounded-sm font-kanit mt-20">
                <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">โปรไฟล์ของฉัน</h1>

                {/* Fullname */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-700" size={20} />
                        <input
                            type="text"
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full p-3 pl-10 border text-gray-600 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-700 outline-none"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-700" size={20} />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full p-3 pl-10 border text-gray-600 rounded-lg bg-gray-200 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Phone Number (NEW) */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-700" size={20} />
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full p-3 pl-10 border text-gray-600 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-700 outline-none"
                        />
                    </div>
                </div>

                <div className="mb-4 flex gap-4">
                    {/* Field of Study */}
                    <div className="w-2/3">
                        <label className="block text-sm font-medium text-gray-700">สาขาวิชา</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-3 text-gray-700" size={20} />
                            <input
                                type="text"
                                name="fieldOfStudy"
                                value={formData.fieldOfStudy}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full p-3 pl-10 border text-gray-600 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-700 outline-none"
                            />
                        </div>
                    </div>

                    {/* Year */}
                    <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-700">ปีที่ศึกษา</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-gray-700" size={20} />
                            <input
                                type="number"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full p-3 pl-10 border text-gray-600 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-700 outline-none"
                            />
                        </div>
                    </div>
                </div>


                {/* ปุ่ม แก้ไข / บันทึก */}
                {isEditing ? (
                    <button
                        onClick={handleSave}
                        className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition"
                    >
                        บันทึกข้อมูล
                    </button>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full mt-4 bg-orange-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition"
                    >
                        แก้ไขข้อมูล
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;