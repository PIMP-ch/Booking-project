"use client";

import React, { useState, useEffect } from "react";
import { Table } from "flowbite-react";
import { getReturnedBookings } from "@/utils/api";
import { Icon } from "@iconify/react";

interface Booking {
    _id: string;
    userId: {
        _id: string;
        fullname: string;
        email: string;
        fieldOfStudy: string;
        year: number;
    };
    stadiumId: {
        _id: string;
        nameStadium: string;
    };
    equipment: {
        equipmentId: {
            _id: string;
            name: string;
        };
        quantity: number;
    }[];
    startDate: string;
    endDate: string;
    status: string;
}

const HistoryBookingPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        const fetchBookings = async () => {
            const data = await getReturnedBookings();
            setBookings(data);
        };
        fetchBookings();
    }, []);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md font-kanit">
            <h2 className="text-xl font-bold mb-4">ประวัติการจองที่ส่งคืนเรียบร้อย</h2>

            <Table hoverable>
                <Table.Head>
                    <Table.HeadCell>ลำดับ</Table.HeadCell>
                    <Table.HeadCell>ผู้จอง</Table.HeadCell>
                    <Table.HeadCell>สนามกีฬา</Table.HeadCell>
                    <Table.HeadCell>อุปกรณ์ที่จอง</Table.HeadCell>
                    <Table.HeadCell>วันที่</Table.HeadCell>
                    <Table.HeadCell>สถานะ</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {bookings.length === 0 ? (
                        <Table.Row>
                            <Table.Cell colSpan={6} className="text-center py-4">
                                ไม่มีประวัติการจองที่ส่งคืนแล้ว
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        bookings.map((booking, index) => (
                            <Table.Row key={booking._id}>
                                {/* ลำดับ */}
                                <Table.Cell>{index + 1}</Table.Cell>

                                {/* รายละเอียดผู้จอง */}
                                <Table.Cell>
                                    <p><strong>{booking.userId.fullname}</strong></p>
                                    <p className="text-sm text-gray-600">{booking.userId.email}</p>
                                    <p className="text-sm">สาขา: {booking.userId.fieldOfStudy}</p>
                                    <p className="text-sm">ปีที่ศึกษา: {booking.userId.year}</p>
                                </Table.Cell>

                                {/* ข้อมูลสนามกีฬา */}
                                <Table.Cell>{booking.stadiumId.nameStadium}</Table.Cell>

                                {/* ข้อมูลอุปกรณ์ที่จอง */}
                                <Table.Cell>
                                    <ol className="list-decimal pl-4">
                                        {booking.equipment.map((item, index) => (
                                            <li key={item.equipmentId._id}>
                                                {item.equipmentId.name} - {item.quantity} ชิ้น
                                            </li>
                                        ))}
                                    </ol>
                                </Table.Cell>

                                {/* วันที่จอง */}
                                <Table.Cell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">วันที่เริ่ม:</span>
                                        <span>
                                            {new Date(booking.startDate).toLocaleDateString("th-TH", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                calendar: "gregory",
                                            })}
                                        </span>
                                        <span className="font-semibold mt-2">วันที่สิ้นสุด:</span>
                                        <span>
                                            {new Date(booking.endDate).toLocaleDateString("th-TH", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                calendar: "gregory",
                                            })}
                                        </span>
                                    </div>
                                </Table.Cell>


                                {/* สถานะ */}
                                <Table.Cell>
                                    <span className="px-2 py-1 rounded-lg text-white bg-green-500">
                                        ส่งคืนเรียบร้อย
                                    </span>
                                </Table.Cell>
                            </Table.Row>
                        ))
                    )}
                </Table.Body>
            </Table>
        </div>
    );
};

export default HistoryBookingPage;
