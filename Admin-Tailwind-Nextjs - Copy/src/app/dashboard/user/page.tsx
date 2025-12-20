"use client";

import React, { useState, useEffect } from "react";
import { Table, TextInput, Button, Modal } from "flowbite-react";
import { getAllUsers, blockUser, unblockUser, deleteUser } from "@/utils/api";

interface User {
    _id: string;
    fullname: string;
    email: string;
    phoneNumber: string;
    fieldOfStudy: string;
    year: number;
    blockUntil: string | null; // ใช้เพื่อตรวจสอบว่าสถานะถูกบล็อกหรือไม่
}

const UserPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [blockDays, setBlockDays] = useState<number>(15);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Fetch all users
    const fetchUsers = async () => {
        try {
            const data = await getAllUsers(); // Call the API function to fetch users
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    // Fetch users on component load
    useEffect(() => {
        fetchUsers();
    }, []);

    // ฟังก์ชันบล็อกผู้ใช้
    const handleBlockUser = async () => {
        if (!selectedUser) return;
        try {
            await blockUser(selectedUser._id, blockDays);
            setIsBlockModalOpen(false);
            fetchUsers(); // รีเฟรชข้อมูลผู้ใช้
        } catch (error) {
            console.error("Failed to block user:", error);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser._id);
            setIsDeleteModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    };


    // ฟังก์ชันปลดบล็อกผู้ใช้
    const handleUnblockUser = async () => {
        if (!selectedUser) return;
        try {
            await unblockUser(selectedUser._id);
            setIsUnblockModalOpen(false);
            fetchUsers(); // รีเฟรชข้อมูลผู้ใช้
        } catch (error) {
            console.error("Failed to unblock user:", error);
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter((user) =>
        [user.fullname, user.email, user.phoneNumber].some((field) =>
            (field ?? "").toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-md font-kanit">
            <h2 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h2>

            {/* Input ค้นหา */}
            <TextInput
                type="text"
                placeholder="ค้นหาผู้ใช้ตามชื่อ, อีเมล หรือเบอร์โทร"
                className="mb-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Table hoverable>
                <Table.Head>
                    <Table.HeadCell>ลำดับ</Table.HeadCell>
                    <Table.HeadCell>ชื่อเต็ม</Table.HeadCell>
                    <Table.HeadCell>อีเมล</Table.HeadCell>
                    <Table.HeadCell>เบอร์โทรศัพท์</Table.HeadCell>
                    <Table.HeadCell>สาขาวิชา</Table.HeadCell>
                    <Table.HeadCell>ปีที่ศึกษา</Table.HeadCell>
                    <Table.HeadCell>สถานะบัญชี</Table.HeadCell>
                    <Table.HeadCell>จัดการ</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {filteredUsers.map((user, index) => (
                        <Table.Row key={user._id}>
                            <Table.Cell>{index + 1}</Table.Cell>
                            <Table.Cell>{user.fullname}</Table.Cell>
                            <Table.Cell>{user.email}</Table.Cell>
                            <Table.Cell>{user.phoneNumber}</Table.Cell>
                            <Table.Cell>{user.fieldOfStudy}</Table.Cell>
                            <Table.Cell>{user.year}</Table.Cell>
                            <Table.Cell>
                                {user.blockUntil && new Date(user.blockUntil) > new Date() ? (
                                    <span className="text-red-600 font-semibold">Blocked</span>
                                ) : (
                                    <span className="text-green-600 font-semibold">Active</span>
                                )}
                            </Table.Cell>

                            <Table.Cell>
                                <div className="flex flex-row gap-2">
                                    {user.blockUntil && new Date(user.blockUntil) > new Date() ? (
                                        <Button
                                            color="green"
                                            size="xs"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsUnblockModalOpen(true);
                                            }}
                                        >
                                            ปลดบล็อก
                                        </Button>
                                    ) : (
                                        <Button
                                            color="red"
                                            size="xs"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsBlockModalOpen(true);
                                            }}
                                        >
                                            บล็อก
                                        </Button>
                                    )}
                                    <Button
                                        color="failure"
                                        size="xs"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setIsDeleteModalOpen(true);
                                        }}
                                    >
                                        ลบ
                                    </Button>
                                </div>
                            </Table.Cell>


                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            <Modal className="font-kanit" show={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <Modal.Header>ลบผู้ใช้</Modal.Header>
                <Modal.Body>
                    <p>
                        คุณแน่ใจหรือไม่ว่าต้องการ <strong className="text-red-600">ลบ</strong> ผู้ใช้
                        <br />
                        <strong>{selectedUser?.fullname}</strong> นี้อย่างถาวร?
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setIsDeleteModalOpen(false)}>
                        ยกเลิก
                    </Button>
                    <Button color="failure" onClick={handleDeleteUser}>
                        ยืนยันลบ
                    </Button>
                </Modal.Footer>
            </Modal>



            {/* Modal ยืนยันการบล็อกผู้ใช้ */}
            <Modal className="font-kanit" show={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)}>
                <Modal.Header>บล็อกผู้ใช้</Modal.Header>
                <Modal.Body>
                    <p>คุณต้องการบล็อก <strong>{selectedUser?.fullname}</strong> หรือไม่?</p>
                    <p>กรุณาเลือกระยะเวลาที่ต้องการบล็อก:</p>
                    <select
                        className="w-full p-2 border rounded mt-2"
                        value={blockDays}
                        onChange={(e) => setBlockDays(Number(e.target.value))}
                    >
                        <option value={15}>15 วัน</option>
                        <option value={30}>30 วัน</option>
                        <option value={60}>60 วัน</option>
                    </select>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setIsBlockModalOpen(false)}>
                        ยกเลิก
                    </Button>
                    <Button color="red" onClick={handleBlockUser}>
                        ยืนยันบล็อก
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal ยืนยันการปลดบล็อกผู้ใช้ */}
            <Modal className="font-kanit" show={isUnblockModalOpen} onClose={() => setIsUnblockModalOpen(false)}>
                <Modal.Header>ปลดบล็อกผู้ใช้</Modal.Header>
                <Modal.Body>
                    <p>คุณต้องการปลดบล็อก <strong>{selectedUser?.fullname}</strong> หรือไม่?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setIsUnblockModalOpen(false)}>
                        ยกเลิก
                    </Button>
                    <Button color="green" onClick={handleUnblockUser}>
                        ยืนยันปลดบล็อก
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UserPage;
