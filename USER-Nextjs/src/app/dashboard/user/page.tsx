"use client";

import React, { useState, useEffect } from "react";
import { Table } from "flowbite-react";
import { getAllUsers } from "@/utils/api";

interface User {
    _id: string;
    fullname: string;
    email: string;
    fieldOfStudy: string;
    year: number;
}

const UserPage = () => {
    const [users, setUsers] = useState<User[]>([]);

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

    return (
        <div className="p-6 bg-white rounded-lg shadow-md font-kanit">
            <h2 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h2>
            <Table hoverable>
                <Table.Head>
                    <Table.HeadCell>ลำดับ</Table.HeadCell>
                    <Table.HeadCell>ชื่อเต็ม</Table.HeadCell>
                    <Table.HeadCell>อีเมล</Table.HeadCell>
                    <Table.HeadCell>สาขาวิชา</Table.HeadCell>
                    <Table.HeadCell>ปีที่ศึกษา</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {users.map((user, index) => (
                        <Table.Row key={user._id}>
                            <Table.Cell>{index + 1}</Table.Cell>
                            <Table.Cell>{user.fullname}</Table.Cell>
                            <Table.Cell>{user.email}</Table.Cell>
                            <Table.Cell>{user.fieldOfStudy}</Table.Cell>
                            <Table.Cell>{user.year}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </div>
    );
};

export default UserPage;
