"use client";

import React, { useState, useEffect } from "react";
import { Table, TextInput, Button, Modal, Badge } from "flowbite-react";
import { getAllUsers, updateUserStatus, deleteUser } from "@/utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type UserStatus = "NEW" | "Pending" | "Active" | "Inactive" | "Suspended" | "Expired" | "Cancelled" | "Rejected" | "Deleted";

interface User {
    id: string;
    fullname: string;
    email: string;
    phoneNumber: string;
    fieldOfStudy: string;
    year: number;
    userType: string;
    department: string;
    status: UserStatus;
    lastLoginAt: string | null;
    blockUntil: string | null;
    createdAt: string;
}

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
    { value: "NEW",       label: "NEW — รอตรวจสอบสิทธิ์" },
    { value: "Pending",   label: "Pending — รอเจ้าหน้าที่ตรวจสอบ" },
    { value: "Active",    label: "Active — ใช้งานได้ปกติ" },
    { value: "Inactive",  label: "Inactive — ไม่ได้ใช้งานเป็นเวลานาน" },
    { value: "Suspended", label: "Suspended — ระงับชั่วคราว" },
    { value: "Expired",   label: "Expired — หมดอายุ/จบการศึกษา" },
    { value: "Cancelled", label: "Cancelled — ส่งคำขอยกเลิก" },
    { value: "Rejected",  label: "Rejected — ไม่อนุมัติ" },
];

const STATUS_TABS: { value: "ALL" | UserStatus; label: string }[] = [
    { value: "ALL",      label: "ทั้งหมด" },
    { value: "NEW",      label: "NEW" },
    { value: "Pending",  label: "Pending" },
    { value: "Active",   label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Suspended", label: "Suspended" },
    { value: "Expired",  label: "Expired" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<UserStatus, { color: string; label: string }> = {
    NEW:       { color: "bg-yellow-100 text-yellow-800",  label: "NEW" },
    Pending:   { color: "bg-blue-100 text-blue-800",      label: "Pending" },
    Active:    { color: "bg-green-100 text-green-800",    label: "Active" },
    Inactive:  { color: "bg-indigo-100 text-indigo-700",  label: "Inactive" },
    Suspended: { color: "bg-orange-100 text-orange-800",  label: "Suspended" },
    Expired:   { color: "bg-gray-100 text-gray-600",      label: "Expired" },
    Cancelled: { color: "bg-purple-100 text-purple-800",  label: "Cancelled" },
    Rejected:  { color: "bg-red-100 text-red-800",        label: "Rejected" },
    Deleted:   { color: "bg-gray-200 text-gray-500",      label: "Deleted" },
};

const UserPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"ALL" | UserStatus>("NEW");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newStatus, setNewStatus] = useState<UserStatus>("Active");
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openStatusModal = (user: User) => {
        setSelectedUser(user);
        setNewStatus(user.status === "NEW" ? "Active" : user.status);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            await updateUserStatus(selectedUser.id, newStatus);
            toast.success(`เปลี่ยนสถานะ "${selectedUser.fullname}" เป็น ${newStatus} สำเร็จ`);
            setIsStatusModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error?.message || "เปลี่ยนสถานะไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            await deleteUser(selectedUser.id);
            toast.success(`ลบบัญชี "${selectedUser.fullname}" สำเร็จ`);
            setIsDeleteModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error?.message || "ลบผู้ใช้ไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    // นับจำนวนตาม status
    const countByStatus = (status: "ALL" | UserStatus) =>
        status === "ALL" ? users.length : users.filter((u) => u.status === status).length;

    const filteredUsers = users.filter((user) => {
        const matchTab = activeTab === "ALL" || user.status === activeTab;
        const matchSearch = [user.fullname, user.email, user.phoneNumber].some((f) =>
            (f ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        );
        return matchTab && matchSearch;
    });

    return (
        <div className="p-6 bg-white rounded-lg shadow-md font-kanit">
            <h2 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h2>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                {STATUS_TABS.map((tab) => {
                    const count = countByStatus(tab.value);
                    const isActive = activeTab === tab.value;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                isActive
                                    ? "bg-gray-800 text-white border-gray-800"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                            }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-gray-100"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <TextInput
                type="text"
                placeholder="ค้นหาผู้ใช้ตามชื่อ, อีเมล หรือเบอร์โทร"
                className="mb-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Table */}
            <Table hoverable>
                <Table.Head>
                    <Table.HeadCell>#</Table.HeadCell>
                    <Table.HeadCell>ชื่อเต็ม</Table.HeadCell>
                    <Table.HeadCell>อีเมล</Table.HeadCell>
                    <Table.HeadCell>เบอร์โทร</Table.HeadCell>
                    <Table.HeadCell>ประเภท / สาขา</Table.HeadCell>
                    <Table.HeadCell>สถานะ</Table.HeadCell>
                    <Table.HeadCell>Login ล่าสุด</Table.HeadCell>
                    <Table.HeadCell>วันที่สมัคร</Table.HeadCell>
                    <Table.HeadCell>จัดการ</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {filteredUsers.length === 0 ? (
                        <Table.Row>
                            <Table.Cell colSpan={8} className="text-center text-gray-400 py-8">
                                ไม่พบข้อมูลผู้ใช้
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        filteredUsers.map((user, index) => {
                            const badge = STATUS_BADGE[user.status] ?? STATUS_BADGE.Deleted;
                            return (
                                <Table.Row key={user.id}>
                                    <Table.Cell>{index + 1}</Table.Cell>
                                    <Table.Cell className="font-medium">{user.fullname}</Table.Cell>
                                    <Table.Cell className="text-sm">{user.email}</Table.Cell>
                                    <Table.Cell>{user.phoneNumber}</Table.Cell>
                                    <Table.Cell className="text-sm">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-1 ${
                                            user.userType === "student"
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "bg-teal-50 text-teal-700"
                                        }`}>
                                            {user.userType === "student" ? "นักศึกษา" : "บุคลากร"}
                                        </span>
                                        <span className="text-gray-500">
                                            {user.userType === "student" ? user.fieldOfStudy : user.department}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-sm text-gray-500">
                                        {user.lastLoginAt
                                            ? new Date(user.lastLoginAt).toLocaleDateString("th-TH")
                                            : <span className="text-gray-400 italic">ยังไม่เคย</span>}
                                    </Table.Cell>
                                    <Table.Cell className="text-sm text-gray-500">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("th-TH") : "-"}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="xs"
                                                color="blue"
                                                onClick={() => openStatusModal(user)}
                                            >
                                                เปลี่ยนสถานะ
                                            </Button>
                                            <Button
                                                size="xs"
                                                color="failure"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            >
                                                ระงับ
                                            </Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })
                    )}
                </Table.Body>
            </Table>

            {/* Modal: เปลี่ยนสถานะ */}
            <Modal className="font-kanit" show={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}>
                <Modal.Header>เปลี่ยนสถานะสมาชิก</Modal.Header>
                <Modal.Body>
                    <p className="mb-3">
                        ผู้ใช้: <strong>{selectedUser?.fullname}</strong>
                        <br />
                        <span className="text-sm text-gray-500">{selectedUser?.email}</span>
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                        สถานะปัจจุบัน:{" "}
                        {selectedUser && (
                            <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[selectedUser.status]?.color}`}>
                                {STATUS_BADGE[selectedUser.status]?.label}
                            </span>
                        )}
                    </p>

                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                        เปลี่ยนเป็นสถานะ
                    </label>
                    <select
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {/* คำอธิบาย status ที่เลือก */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                        {newStatus === "Active"    && "✅ อนุมัติให้ผู้ใช้เข้าสู่ระบบและใช้งานได้ปกติ"}
                        {newStatus === "Rejected"  && "❌ ไม่อนุมัติการสมัครสมาชิก ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้"}
                        {newStatus === "Pending"   && "🔍 ระบุว่ากำลังตรวจสอบข้อมูลอยู่"}
                        {newStatus === "Inactive"  && "💤 ตั้งเป็น Inactive ด้วยตนเอง (ปกติระบบจะทำอัตโนมัติ) — user ยังสามารถ login เพื่อ restore ได้"}
                        {newStatus === "Suspended" && "⏸️ ระงับการใช้งานชั่วคราว สามารถเปิดใช้ใหม่ได้ภายหลัง"}
                        {newStatus === "Expired"   && "⏰ บัญชีหมดอายุ (จบการศึกษา) จะไม่สามารถเข้าใช้ได้อีก"}
                        {newStatus === "Cancelled" && "🚫 บันทึกคำขอยกเลิกสมาชิก"}
                        {newStatus === "NEW"       && "🆕 รีเซ็ตกลับเป็นสถานะใหม่ รอการตรวจสอบอีกครั้ง"}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setIsStatusModalOpen(false)} disabled={loading}>
                        ยกเลิก
                    </Button>
                    <Button
                        color={newStatus === "Active" ? "success" : newStatus === "Rejected" ? "failure" : "blue"}
                        onClick={handleUpdateStatus}
                        disabled={loading || newStatus === selectedUser?.status}
                    >
                        {loading ? "กำลังบันทึก..." : "ยืนยัน"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal: ระงับบัญชี */}
            <Modal className="font-kanit" show={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <Modal.Header>ระงับบัญชีผู้ใช้</Modal.Header>
                <Modal.Body>
                    <p>
                        คุณแน่ใจหรือไม่ว่าต้องการ <strong className="text-red-600">ระงับ</strong> บัญชีของ{" "}
                        <strong>{selectedUser?.fullname}</strong>?
                        <br />
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setIsDeleteModalOpen(false)} disabled={loading}>
                        ยกเลิก
                    </Button>
                    <Button color="failure" onClick={handleDeleteUser} disabled={loading}>
                        {loading ? "กำลังระงับ..." : "ยืนยันระงับ"}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default UserPage;
