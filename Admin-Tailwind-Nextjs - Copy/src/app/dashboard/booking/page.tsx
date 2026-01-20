"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Dropdown } from "flowbite-react";
import { getAllBookings, confirmBooking, cancelBooking, resetBookingStatus } from "@/utils/api";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Booking {
    _id: string;
    activityName?: string;
    userId: {
        _id: string;
        fullname: string;
        email: string;
        phoneNumber: string;
        fieldOfStudy: string;
        year: number;
    } | null; // แก้ไขให้รองรับค่า null จาก Database
    stadiumId: {
        _id: string;
        nameStadium: string;
        descriptionStadium: string;
    } | null;
    buildingIds?: {
        _id: string;
        name: string;
    }[];
    equipment: {
        equipmentId: {
            _id: string;
            name: string;
            quantity: number;
        };
        quantity: number;
    }[];
    startDate: string;
    startTime: string;
    endTime: string;
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
    const [cancelReason, setCancelReason] = useState("");
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });
    const [returnModal, setReturnModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });

    const fetchBookings = async () => {
        try {
            const data = await getAllBookings();
            setBookings(data);
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        }
    };

    const handleConfirmBooking = async (id: string) => {
        try {
            await confirmBooking(id);
            fetchBookings();
            closeConfirmModal();
        } catch (err) {
            console.error("Failed to confirm booking:", err);
        }
    };

    const handleCancelBooking = async (id: string) => {
        if (!cancelReason.trim()) {
            toast.error("กรุณาระบุเหตุผลในการยกเลิก");
            return;
        }

        try {
            await cancelBooking(id, cancelReason);
            toast.success("ยกเลิกการจองเรียบร้อยแล้ว");
            fetchBookings();
            closeCancelModal();
            setCancelReason("");
        } catch (err) {
            toast.error("ยกเลิกการจองไม่สำเร็จ");
            console.error("Failed to cancel booking:", err);
        }
    };


    const handleResetBooking = async (id: string) => {
        try {
            await resetBookingStatus(id);
            fetchBookings();
            closeReturnModal();
        } catch (err) {
            console.error("Failed to reset booking status:", err);
        }
    };

    const openConfirmModal = (id: string) => setConfirmModal({ isOpen: true, id });
    const closeConfirmModal = () => setConfirmModal({ isOpen: false, id: null });
    const openCancelModal = (id: string) => {
    setCancelReason("");              // reset ทุกครั้ง
    setCancelModal({ isOpen: true, id });
    };

    const closeCancelModal = () => {
    setCancelModal({ isOpen: false, id: null });
    setCancelReason("");
    };
    const openReturnModal = (id: string) => setReturnModal({ isOpen: true, id });
    const closeReturnModal = () => setReturnModal({ isOpen: false, id: null });

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
            <ToastContainer position="top-right" autoClose={2500} />
            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
                {["pending", "confirmed", "canceled"].map((tab) => (
                    <button
                        key={tab}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "pending" ? "รอการยืนยัน" : tab === "confirmed" ? "ยืนยันแล้ว" : "ยกเลิกแล้ว"}
                    </button>
                ))}
            </div>

            {/* Booking Tables */}
            <div className="overflow-x-auto">
                {activeTab === "pending" ? (
                    <BookingTable bookings={filteredBookings} onConfirm={openConfirmModal} onCancel={openCancelModal} />
                ) : activeTab === "confirmed" ? (
                    <BookingTableConfirmed bookings={filteredBookings} onReset={openReturnModal} />
                ) : (
                    <BookingTableCanceled bookings={filteredBookings} />
                )}
            </div>

            {/* Modals (รวมไว้ที่เดียวเพื่อความสะอาด) */}
            <Modal show={confirmModal.isOpen} onClose={closeConfirmModal} className="font-kanit">
            <Modal.Header>ยืนยันการจอง</Modal.Header>
            <Modal.Body>คุณต้องการยืนยันการจองนี้หรือไม่?</Modal.Body>
            <Modal.Footer>
                <Button
                color="success"
                type="button"
                onClick={() => confirmModal.id && handleConfirmBooking(confirmModal.id)}
                >
                    ยืนยัน
                </Button>
                <Button color="gray" type="button" onClick={closeConfirmModal}>
                 ยกเลิก
                </Button>
                </Modal.Footer>
            </Modal>


            <Modal
                show={cancelModal.isOpen}
                onClose={closeCancelModal}
                className="font-kanit"
            >
            <Modal.Header className="text-red-600">
                ยกเลิกการจอง
            </Modal.Header>

            <Modal.Body>
                <p className="text-gray-500 text-sm mb-4">
                คุณต้องการยกเลิกการจองนี้หรือไม่? ระบบจะคืนทรัพยากรสนามและอุปกรณ์
                </p>

                <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผลที่ยกเลิกการจอง"
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-400 outline-none"
                rows={4}
                />
            </Modal.Body>

            <Modal.Footer>
                <Button
                color="failure"
                type="button"
                onClick={() =>
                    cancelModal.id && handleCancelBooking(cancelModal.id)
                }
                >
                ยืนยันการยกเลิก
                </Button>

                <Button color="gray" type="button" onClick={closeCancelModal}>
                ปิด
                </Button>
            </Modal.Footer>
            </Modal>
  

            <Modal show={returnModal.isOpen} onClose={closeReturnModal} className="font-kanit">
                <Modal.Header>ยืนยันการส่งคืนสนาม</Modal.Header>
                <Modal.Body>คุณต้องการส่งคืนสนามและรีเซ็ตสถานะการจองนี้ใช่หรือไม่?</Modal.Body>
                <Modal.Footer>
                 <Button
                    color="success"
                    type="button"
                    onClick={() => returnModal.id && handleResetBooking(returnModal.id)}
                    >
                    ยืนยันการคืนสนาม
                 </Button>

                    <Button color="gray" type="button" onClick={closeReturnModal}>
                    ปิด
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

// --- Sub Components ---

const BookingTable: React.FC<{ bookings: Booking[]; onConfirm: (id: string) => void; onCancel: (id: string) => void }> = ({ bookings, onConfirm, onCancel }) => (
    <Table hoverable>
        <Table.Head>
            <Table.HeadCell>ลำดับ</Table.HeadCell>
            <Table.HeadCell>ผู้จอง</Table.HeadCell>
            <Table.HeadCell>สนามกีฬา</Table.HeadCell>
            <Table.HeadCell>อุปกรณ์</Table.HeadCell>
            <Table.HeadCell>วันที่ & เวลา</Table.HeadCell>
            <Table.HeadCell className="text-center">การจัดการ</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
            {bookings.length === 0 ? (
                <Table.Row><Table.Cell colSpan={6} className="text-center py-10 text-gray-500">ไม่มีข้อมูลรอการยืนยัน</Table.Cell></Table.Row>
            ) : (
                bookings.map((booking, index) => (
                    <Table.Row key={booking._id} className="bg-white">
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>
                            <p className="font-bold text-gray-900">{booking.userId?.fullname || "ไม่พบชื่อผู้ใช้"}</p>
                            <p className="text-xs text-gray-500">{booking.userId?.email || "-"}</p>
                            <p className="text-xs text-gray-500">{booking.userId?.phoneNumber || "-"}</p>
                        </Table.Cell>
                        <Table.Cell>
                            <div className="font-medium">
                                {booking.stadiumId?.nameStadium || "ไม่ระบุสนาม"}
                            </div>

                            {booking.buildingIds && booking.buildingIds.length > 0 && (
                                <div className="text-xs text-gray-500">
                                    อาคาร: {booking.buildingIds.map((b) => b.name).join(", ") || "-"}
                                </div>
                            )}
                            <div className="text-xs text-gray-500">
                                กิจกรรม: {booking.activityName || "-"}
                            </div>
                            </Table.Cell>
                        <Table.Cell>
                            <ul className="text-xs list-disc pl-4 text-gray-600">
                                {booking.equipment.map((item, idx) => (
                                    <li key={idx}>{item.equipmentId?.name} ({item.quantity})</li>
                                ))}
                            </ul>
                        </Table.Cell>
                        <Table.Cell className="text-xs">
                            <div className="flex flex-col">
                                <span className="font-medium text-blue-600">{new Date(booking.startDate).toLocaleDateString("th-TH")}</span>
                                <span className="text-gray-500">{booking.startTime} - {booking.endTime}</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell className="text-center">
                            <Dropdown
                                inline
                                label={null}
                                renderTrigger={() => (
                                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <Icon icon="bi:three-dots-vertical" className="w-5 h-5 text-gray-500" />
                                    </button>
                                )}
                            >
                                <Dropdown.Item onClick={() => onConfirm(booking._id)} className="text-green-600 gap-2">
                                    <Icon icon="solar:check-circle-bold" /> ยืนยัน
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => onCancel(booking._id)} className="text-red-600 gap-2">
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

const BookingTableConfirmed: React.FC<{ bookings: Booking[]; onReset: (id: string) => void }> = ({ bookings, onReset }) => (
    <Table hoverable>
        <Table.Head>
            <Table.HeadCell>ลำดับ</Table.HeadCell>
            <Table.HeadCell>ผู้จอง</Table.HeadCell>
            <Table.HeadCell>สนามกีฬา</Table.HeadCell>
            <Table.HeadCell>วัน/เวลาที่จอง</Table.HeadCell>
            <Table.HeadCell className="text-center">การจัดการ</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
            {bookings.length === 0 ? (
                <Table.Row><Table.Cell colSpan={5} className="text-center py-10 text-gray-500">ไม่มีข้อมูลยืนยันแล้ว</Table.Cell></Table.Row>
            ) : (
                bookings.map((booking, index) => (
                    <Table.Row key={booking._id}>
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>
                            <p className="font-medium">{booking.userId?.fullname || "N/A"}</p>
                            <small className="text-gray-400">{booking.userId?.email || "-"}</small>
                            <div className="text-xs text-gray-400">{booking.userId?.phoneNumber || "-"}</div>
                        </Table.Cell>
                        <Table.Cell>
                        <div className="font-medium">
                            {booking.stadiumId?.nameStadium || "-"}
                        </div>

                        {booking.buildingIds && booking.buildingIds.length > 0 && (
                            <div className="text-xs text-gray-500">
                                อาคาร: {booking.buildingIds.map((b) => b.name).join(", ") || "-"}
                            </div>
                        )}
                        <div className="text-xs text-gray-500">
                            กิจกรรม: {booking.activityName || "-"}
                        </div>
                        </Table.Cell>
                        <Table.Cell className="text-xs">
                            {new Date(booking.startDate).toLocaleDateString("th-TH")} | {booking.startTime} - {booking.endTime}
                        </Table.Cell>
                        <Table.Cell className="text-center">
                            <Dropdown
                                inline
                                label={null}
                                renderTrigger={() => (
                                    <button className="p-2 hover:bg-gray-100 rounded-full">
                                        <Icon icon="bi:three-dots-vertical" className="w-5 h-5 text-gray-500" />
                                    </button>
                                )}
                            >
                                <Dropdown.Item onClick={() => onReset(booking._id)} className="text-blue-600 gap-2">
                                    <Icon icon="solar:refresh-outline" /> ส่งคืนสนาม
                                </Dropdown.Item>
                            </Dropdown>
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
        <Table.Body className="divide-y">
            {bookings.map((booking, index) => (
                <Table.Row key={booking._id} className="opacity-70 bg-gray-50">
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell>{booking.userId?.fullname || "N/A"}</Table.Cell>
                    <Table.Cell>{booking.stadiumId?.nameStadium}</Table.Cell>
                    <Table.Cell className="text-xs">{new Date(booking.startDate).toLocaleDateString("th-TH")}</Table.Cell>
                    <Table.Cell><span className="text-red-500 font-bold uppercase text-[10px]">Canceled</span></Table.Cell>
                </Table.Row>
            ))}
        </Table.Body>
    </Table>
);

export default BookingPage;