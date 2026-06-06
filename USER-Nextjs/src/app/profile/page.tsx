"use client";

import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { updateUser, updateUserStatus } from "@/utils/api";
import { toast } from "react-toastify";
import { User, Mail, BookOpen, Calendar, Phone, AlertTriangle, X } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    NEW:       { label: "รอตรวจสอบสิทธิ์",       color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    Pending:   { label: "รอเจ้าหน้าที่ตรวจสอบ",  color: "bg-blue-100 text-blue-800 border-blue-300" },
    Active:    { label: "ใช้งานได้ปกติ",          color: "bg-green-100 text-green-800 border-green-300" },
    Inactive:  { label: "ไม่ได้ใช้งานเป็นเวลานาน", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
    Suspended: { label: "ระงับการใช้งานชั่วคราว", color: "bg-orange-100 text-orange-800 border-orange-300" },
    Expired:   { label: "หมดอายุ",                color: "bg-gray-100 text-gray-600 border-gray-300" },
    Cancelled: { label: "ส่งคำขอยกเลิกแล้ว",     color: "bg-purple-100 text-purple-800 border-purple-300" },
    Rejected:  { label: "ไม่ผ่านการอนุมัติ",      color: "bg-red-100 text-red-800 border-red-300" },
};

const ProfilePage = () => {
    const { user, updateUser: updateLocalUser, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: "",
        fullname: "",
        email: "",
        phoneNumber: "",
        fieldOfStudy: "",
        year: 0,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                id: user.id || "",
                fullname: user.fullname || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
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
            if (!formData.id) {
                toast.error("ไม่พบ ID ของผู้ใช้");
                return;
            }
            const updatedUser = await updateUser(formData.id, formData);
            updateLocalUser(updatedUser.updatedUser);
            setIsEditing(false);
            toast.success("บันทึกข้อมูลสำเร็จ!");
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    const handleCancelMembership = async () => {
        if (!user?.id) return;
        setCancelLoading(true);
        try {
            await updateUserStatus(user.id, "Cancelled");
            toast.info("ส่งคำขอยกเลิกสมาชิกเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ดำเนินการ");
            setShowCancelModal(false);
            // logout แล้ว redirect ไปหน้าแจ้งสถานะ
            setTimeout(() => {
                logout();
                window.location.href = "/user/pending-approval?status=Cancelled";
            }, 1500);
        } catch (error: any) {
            toast.error(error?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setCancelLoading(false);
        }
    };

    const statusInfo = user?.status ? STATUS_LABEL[user.status] : null;
    const canCancel = user?.status === "Active" || user?.status === "Suspended";
    const alreadyCancelled = user?.status === "Cancelled";

    return (
        <div className="h-[100vh] overflow-y-auto">
            <div className="p-6 max-w-md mx-auto bg-white rounded-sm font-kanit mt-20">
                <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">โปรไฟล์ของฉัน</h1>

                {/* Status Badge */}
                {statusInfo && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium mb-5 ${statusInfo.color}`}>
                        <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                        สถานะสมาชิก: {statusInfo.label}
                    </div>
                )}

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

                {/* Phone Number */}
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
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            className="w-2/3 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
                        >
                            บันทึกข้อมูล
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full mt-4 bg-orange-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition"
                    >
                        แก้ไขข้อมูล
                    </button>
                )}

                {/* ปุ่มส่งคำขอยกเลิกสมาชิก */}
                <div className="mt-6 pt-5 border-t border-gray-200">
                    {alreadyCancelled ? (
                        <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                            <AlertTriangle size={16} className="shrink-0" />
                            คำขอยกเลิกสมาชิกของคุณอยู่ระหว่างการดำเนินการ กรุณารอเจ้าหน้าที่ติดต่อกลับ
                        </div>
                    ) : canCancel ? (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="w-full py-2.5 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                        >
                            ส่งคำขอยกเลิกสมาชิก
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Modal ยืนยันยกเลิกสมาชิก */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !cancelLoading && setShowCancelModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 font-kanit">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowCancelModal(false)}
                            disabled={cancelLoading}
                        >
                            <X size={20} />
                        </button>

                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={28} className="text-red-500" />
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-gray-800 text-center mb-2">
                            ยืนยันการยกเลิกสมาชิก
                        </h2>
                        <p className="text-sm text-gray-500 text-center mb-1">
                            คุณต้องการส่งคำขอยกเลิกสมาชิกใช่หรือไม่?
                        </p>
                        <p className="text-xs text-gray-400 text-center mb-6">
                            หลังจากส่งคำขอ บัญชีของคุณจะถูกระงับจนกว่าเจ้าหน้าที่จะดำเนินการ
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={cancelLoading}
                                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                ไม่ใช่
                            </button>
                            <button
                                onClick={handleCancelMembership}
                                disabled={cancelLoading}
                                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition disabled:opacity-60"
                            >
                                {cancelLoading ? "กำลังส่ง..." : "ยืนยันยกเลิก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
