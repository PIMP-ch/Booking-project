"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Dropdown } from "flowbite-react";
import { getAllBookings, confirmBooking, cancelBooking, resetBookingStatus } from "@/utils/api";
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
        descriptionStadium: string;
    };
    equipment: {
        equipmentId: {
            _id: string;
            name: string;
            quantity: number;
        };
        quantity: number;
    }[];
    startDate: string;
    endDate: string;
    status: string;
}

const BookingPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [activeTab, setActiveTab] = useState("pending");
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });
    const [returnModal, setReturnModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });

    // Fetch all bookings
    const fetchBookings = async () => {
        try {
            const data = await getAllBookings();
            setBookings(data);
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        }
    };

    // Confirm booking
    const handleConfirmBooking = async (id: string) => {
        try {
            await confirmBooking(id);
            fetchBookings();
            closeConfirmModal();
        } catch (err) {
            console.error("Failed to confirm booking:", err);
        }
    };

    // Cancel booking
    const handleCancelBooking = async (id: string) => {
        try {
            await cancelBooking(id);
            fetchBookings();
            closeCancelModal();
        } catch (err) {
            console.error("Failed to cancel booking:", err);
        }
    };

    // Reset Booking Status (Return Stadium)
    const handleResetBooking = async (id: string) => {
        try {
            await resetBookingStatus(id);
            fetchBookings();
            closeReturnModal();
        } catch (err) {
            console.error("Failed to reset booking status:", err);
        }
    };

    // Open Confirm Modal
    const openConfirmModal = (id: string) => {
        setConfirmModal({ isOpen: true, id });
    };

    // Close Confirm Modal
    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, id: null });
    };

    // Open Cancel Modal
    const openCancelModal = (id: string) => {
        setCancelModal({ isOpen: true, id });
    };

    // Close Cancel Modal
    const closeCancelModal = () => {
        setCancelModal({ isOpen: false, id: null });
    };

    // Open Return Modal
    const openReturnModal = (id: string) => {
        setReturnModal({ isOpen: true, id });
    };

    // Close Return Modal
    const closeReturnModal = () => {
        setReturnModal({ isOpen: false, id: null });
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter((booking) =>
        activeTab === "pending"
            ? booking.status?.toLowerCase() === "pending"
            : activeTab === "confirmed"
                ? booking.status?.toLowerCase() === "confirmed"
                : booking.status?.toLowerCase() === "canceled"
    );


    return (
        <div className="p-6 bg-white rounded-lg shadow-md font-kanit">
            {/* Tabs */}
            <div className="flex space-x-4 mb-4">
                <button
                    className={`p-2 rounded-lg ${activeTab === "pending" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                    onClick={() => setActiveTab("pending")}
                >
                    รอการยืนยัน
                </button>
                <button
                    className={`p-2 rounded-lg ${activeTab === "confirmed" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                    onClick={() => setActiveTab("confirmed")}
                >
                    ยืนยันแล้ว
                </button>
                <button
                    className={`p-2 rounded-lg ${activeTab === "canceled" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                    onClick={() => setActiveTab("canceled")}
                >
                    ยกเลิกแล้ว
                </button>
            </div>

            {/* Booking Tables */}
            {activeTab === "pending" ? (
                <BookingTable
                    bookings={filteredBookings}
                    onConfirm={(id) => openConfirmModal(id)} // เปิด Confirm Modal
                    onCancel={(id) => openCancelModal(id)} // เปิด Cancel Modal
                />
            ) : activeTab === "confirmed" ? (
                <BookingTableConfirmed
                    bookings={filteredBookings}
                    onReset={(id) => openReturnModal(id)} // เปิด Return Modal
                />
            ) : (
                <BookingTableCanceled bookings={filteredBookings} />
            )}


            {/* Confirm Modal */}
            <Modal className="font-kanit" show={confirmModal.isOpen} onClose={closeConfirmModal}>
                <Modal.Header>ยืนยันการจอง</Modal.Header>
                <Modal.Body>คุณต้องการยืนยันการจองนี้หรือไม่?</Modal.Body>
                <Modal.Footer>
                    <Button
                        color="success"
                        onClick={() => confirmModal.id && handleConfirmBooking(confirmModal.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg"
                    >
                        ยืนยัน
                    </Button>
                    <Button
                        color="failure"
                        onClick={closeConfirmModal}
                        className="bg-gray-200 hover:bg-gray-300 text-black px-2 py-1 rounded-lg"
                    >
                        ยกเลิก
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Cancel Modal */}
            <Modal className="font-kanit" show={cancelModal.isOpen} onClose={closeCancelModal}>
                <Modal.Header>ยกเลิกการจอง</Modal.Header>
                <Modal.Body>คุณต้องการยกเลิกการจองนี้หรือไม่? การยกเลิกจะคืนค่าสนามและอุปกรณ์</Modal.Body>
                <Modal.Footer>
                    <Button
                        color="success"
                        onClick={() => cancelModal.id && handleCancelBooking(cancelModal.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg"
                    >
                        ยืนยันการยกเลิก
                    </Button>
                    <Button
                        color="failure"
                        onClick={closeCancelModal}
                        className="bg-gray-200 hover:bg-gray-300 text-black px-2 py-1 rounded-lg"
                    >
                        ยกเลิก
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Return Modal */}
            <Modal className="font-kanit" show={returnModal.isOpen} onClose={closeReturnModal}>
                <Modal.Header>ยืนยันการส่งคืนสนาม</Modal.Header>
                <Modal.Body>คุณต้องการส่งคืนสนามและรีเซ็ตสถานะการจองนี้หรือไม่?</Modal.Body>
                <Modal.Footer>
                    <Button
                        color="success"
                        onClick={() => returnModal.id && handleResetBooking(returnModal.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg"
                    >
                        ยืนยัน
                    </Button>
                    <Button
                        color="failure"
                        onClick={closeReturnModal}
                        className="bg-gray-200 hover:bg-gray-300 text-black px-2 py-1 rounded-lg"
                    >
                        ยกเลิก
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

interface BookingTableProps {
    bookings: Booking[];
    onConfirm: (id: string) => void;
    onCancel: (id: string) => void;
}

const BookingTable: React.FC<BookingTableProps> = ({ bookings, onConfirm, onCancel }) => (
    <Table hoverable>
        <Table.Head>
            <Table.HeadCell>ลำดับ</Table.HeadCell>
            <Table.HeadCell>ผู้จอง</Table.HeadCell>
            <Table.HeadCell>สนามกีฬา</Table.HeadCell>
            <Table.HeadCell>อุปกรณ์ที่จอง</Table.HeadCell>
            <Table.HeadCell>วันที่</Table.HeadCell>
            <Table.HeadCell>สถานะ</Table.HeadCell>
            <Table.HeadCell>การจัดการ</Table.HeadCell>
        </Table.Head>
        <Table.Body>
            {bookings.length === 0 ? (
                <Table.Row>
                    <Table.Cell colSpan={7} className="text-center">
                        ไม่มีข้อมูลการจอง
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
                            <p>{booking.userId.email}</p>
                            <p>สาขา: {booking.userId.fieldOfStudy}</p>
                            <p>ปี: {booking.userId.year}</p>
                        </Table.Cell>

                        {/* ข้อมูลสนาม */}
                        <Table.Cell>{booking.stadiumId.nameStadium}</Table.Cell>

                        {/* อุปกรณ์ที่จอง */}
                        <Table.Cell>
                            <ol className="list-decimal pl-4">
                                {booking.equipment.map((item) => (
                                    <li key={item.equipmentId._id}>
                                        {item.equipmentId.name} - {item.quantity} ชิ้น
                                    </li>
                                ))}
                            </ol>
                        </Table.Cell>

                        {/* วันที่ */}
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
                            <span className="px-2 py-1 rounded-lg text-white bg-yellow-500">
                                รอการยืนยัน
                            </span>
                        </Table.Cell>

                        {/* การจัดการ */}
                        <Table.Cell>
                            <Dropdown
                                label="..."
                                renderTrigger={() => (
                                    <span className="h-9 w-9 flex justify-center items-center rounded-full hover:bg-gray-100 cursor-pointer">
                                        <Icon icon="lucide:more-vertical" />
                                    </span>
                                )}
                                dismissOnClick={false}
                            >
                                <Dropdown.Item onClick={() => onConfirm(booking._id)}>
                                    <Icon icon="solar:check-circle-bold" /> ยืนยัน
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => onCancel(booking._id)}>
                                    <Icon icon="solar:trash-bin-minimalistic-outline" /> ยกเลิก
                                </Dropdown.Item>
                            </Dropdown>
                        </Table.Cell>
                    </Table.Row>
                ))
            )}
        </Table.Body>
    </Table>
);



interface BookingTableConfirmedProps {
    bookings: Booking[];
    onReset: (id: string) => void;
}

const BookingTableConfirmed: React.FC<BookingTableConfirmedProps> = ({ bookings, onReset }) => (
    <Table hoverable>
        <Table.Head>
            <Table.HeadCell>ลำดับ</Table.HeadCell>
            <Table.HeadCell>ผู้จอง</Table.HeadCell>
            <Table.HeadCell>สนามกีฬา</Table.HeadCell>
            <Table.HeadCell>วันที่</Table.HeadCell>
            <Table.HeadCell>การจัดการ</Table.HeadCell>
        </Table.Head>
        <Table.Body>
            {bookings.length === 0 ? (
                <Table.Row>
                    <Table.Cell colSpan={5} className="text-center">
                        ไม่มีข้อมูลการจองที่ยืนยันแล้ว
                    </Table.Cell>
                </Table.Row>
            ) : (
                bookings.map((booking, index) => (
                    <Table.Row key={booking._id}>
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>
                            {booking.userId.fullname} <br />
                            <small>{booking.userId.email}</small>
                        </Table.Cell>
                        <Table.Cell>{booking.stadiumId.nameStadium}</Table.Cell>
                        <Table.Cell>
                            {new Date(booking.startDate).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                calendar: "gregory",
                            })}{" "}
                            -{" "}
                            {new Date(booking.endDate).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                calendar: "gregory",
                            })}
                        </Table.Cell>
                        <Table.Cell>
                            <Button
                                onClick={() => onReset(booking._id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg"
                            >
                                ส่งคืนสนาม
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                ))
            )}
        </Table.Body>
    </Table>
);

const BookingTableCanceled: React.FC<{ bookings: Booking[] }> = ({ bookings }) => (
    <Table hoverable>
        <Table.Head>
            <Table.HeadCell>ลำดับ</Table.HeadCell>
            <Table.HeadCell>ผู้จอง</Table.HeadCell>
            <Table.HeadCell>สนามกีฬา</Table.HeadCell>
            <Table.HeadCell>วันที่</Table.HeadCell>
            <Table.HeadCell>สถานะ</Table.HeadCell>
        </Table.Head>
        <Table.Body>
            {bookings.length === 0 ? (
                <Table.Row>
                    <Table.Cell colSpan={5} className="text-center">
                        ไม่มีข้อมูลการจองที่ยกเลิกแล้ว
                    </Table.Cell>
                </Table.Row>
            ) : (
                bookings.map((booking, index) => (
                    <Table.Row key={booking._id}>
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>
                            {booking.userId.fullname} <br />
                            <small>{booking.userId.email}</small>
                        </Table.Cell>
                        <Table.Cell>{booking.stadiumId.nameStadium}</Table.Cell>
                        <Table.Cell>
                            {new Date(booking.startDate).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                calendar: "gregory",
                            })}{" "}
                            -{" "}
                            {new Date(booking.endDate).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                calendar: "gregory",
                            })}
                        </Table.Cell>
                        <Table.Cell>
                            <span className="px-2 py-1 rounded-lg text-white bg-red-500">ยกเลิกแล้ว</span>
                        </Table.Cell>
                    </Table.Row>
                ))
            )}
        </Table.Body>
    </Table>
);

export default BookingPage;
