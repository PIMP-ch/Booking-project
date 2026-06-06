"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Dropdown } from "flowbite-react";
import { getAllBookings, confirmBooking, cancelBooking, resetBookingStatus } from "@/utils/api";
import { Icon } from "@iconify/react";
import { toast, ToastContainer } from "react-toastify";
import MonthlyBookingModal from "./MonthlyBookingModal";
import { exportTableToPdf } from "@/utils/exportPdf";
import "react-toastify/dist/ReactToastify.css";

interface Booking {
    id: string;
    activityName?: string;
    cancelReason?: string;
    filePath?: string;
    userId: number | null;
    User: {
        fullname: string;
        email: string;
        phoneNumber: string;
        fieldOfStudy: string;
        year: number;
    } | null;
    Stadium: {
        id: string;
        nameStadium: string;
        descriptionStadium: string;
    } | null;
    Buildings?: {
        id: string;
        name: string;
    }[];
    Equipment: {
        id: string;
        name: string;
        BookingEquipment: { quantity: number };
    }[];
    startDate: string;
    startTime: string;
    endTime: string;
    endDate: string;
    status: string;
}

const PAGE_SIZE = 10;

const BookingPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [activeTab, setActiveTab] = useState("pending");
    const [currentPage, setCurrentPage] = useState(1);
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
    const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

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

    const openDetail = (booking: Booking) => setDetailBooking(booking);
    const closeDetail = () => setDetailBooking(null);

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

    const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const TAB_LABEL: Record<string, string> = {
        pending:   "รอการยืนยัน",
        confirmed: "ยืนยันแล้ว",
        canceled:  "ยกเลิกแล้ว",
    };

    const handleExportPdf = async () => {
        if (filteredBookings.length === 0) {
            toast.warning("ไม่มีข้อมูลสำหรับ export");
            return;
        }
        try {
            await exportTableToPdf({
                title: `รายงานการจอง — ${TAB_LABEL[activeTab] ?? activeTab}`,
                subtitle: `ทั้งหมด ${filteredBookings.length} รายการ`,
                filename: `การจอง_${TAB_LABEL[activeTab]}_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.pdf`,
                headers: ["#", "ผู้จอง", "อีเมล", "สนามกีฬา", "กิจกรรม", "วันที่จอง", "เวลา", "อุปกรณ์", "สถานะ"],
                rows: filteredBookings.map((b, i) => [
                    i + 1,
                    b.User?.fullname || "-",
                    b.User?.email || "-",
                    [b.Stadium?.nameStadium, b.Buildings?.map(bd => bd.name).join(", ")].filter(Boolean).join(" / ") || "-",
                    b.activityName || "-",
                    `${new Date(b.startDate).toLocaleDateString("th-TH")} – ${new Date(b.endDate).toLocaleDateString("th-TH")}`,
                    `${b.startTime} – ${b.endTime}`,
                    b.Equipment?.length > 0
                        ? b.Equipment.map(eq => `${eq.name} (${eq.BookingEquipment?.quantity ?? 0})`).join(", ")
                        : "-",
                    TAB_LABEL[b.status?.toLowerCase()] ?? b.status,
                ]),
                orientation: "landscape",
            });
        } catch {
            toast.error("Export PDF ไม่สำเร็จ");
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md font-kanit">
            <ToastContainer position="top-right" autoClose={2500} />
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">จัดการการจอง</h2>
                <Button size="sm" color="success" onClick={handleExportPdf}>
                    <Icon icon="solar:file-download-bold" height={16} className="mr-1" />
                    Export PDF
                </Button>
            </div>
            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
                {["pending", "confirmed", "canceled"].map((tab) => {
                    const count = bookings.filter(b => b.status?.toLowerCase() === tab).length;
                    return (
                        <button
                            key={tab}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            {tab === "pending" ? "รอการยืนยัน" : tab === "confirmed" ? "ยืนยันแล้ว" : "ยกเลิกแล้ว"}
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-white/20 text-white" : "bg-gray-300 text-gray-600"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-between items-center mb-6">
                <h1>ล็อควันตามตารางเรียน</h1>
                <MonthlyBookingModal
                />
            </div>

            {/* Booking Tables */}
            <div className="overflow-x-auto">
                {activeTab === "pending" ? (
                    <BookingTable bookings={paginatedBookings} onConfirm={openConfirmModal} onCancel={openCancelModal} onDetail={openDetail} />
                ) : activeTab === "confirmed" ? (
                    <BookingTableConfirmed bookings={paginatedBookings} onReset={openReturnModal} onDetail={openDetail} />
                ) : (
                    <BookingTableCanceled bookings={paginatedBookings} onDetail={openDetail} />
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-sm text-gray-500">
                        แสดง {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredBookings.length)} จาก {filteredBookings.length} รายการ
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            «
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === "..." ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-gray-400">…</span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => setCurrentPage(item as number)}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage === item ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        {item}
                                    </button>
                                )
                            )}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ›
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            »
                        </button>
                    </div>
                </div>
            )}

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
                <Modal.Header>ยืนยันการส่งเสร็จสิ้น</Modal.Header>
                <Modal.Body>คุณต้องการส่งเสร็จสิ้นและรีเซ็ตสถานะการจองนี้ใช่หรือไม่?</Modal.Body>
                <Modal.Footer>
                    <Button
                        color="success"
                        type="button"
                        onClick={() => returnModal.id && handleResetBooking(returnModal.id)}
                    >
                        ยืนยันการเสร็จสิ้น
                    </Button>

                    <Button color="gray" type="button" onClick={closeReturnModal}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Detail Modal ── */}
            {detailBooking && (
                <BookingDetailModal
                    booking={detailBooking}
                    onClose={closeDetail}
                    onConfirm={(id) => { openConfirmModal(id); closeDetail(); }}
                    onCancel={(id) => { openCancelModal(id); closeDetail(); }}
                    onReset={(id) => { openReturnModal(id); closeDetail(); }}
                />
            )}
        </div>
    );
};

// --- Sub Components ---

const BookingTable: React.FC<{ bookings: Booking[]; onConfirm: (id: string) => void; onCancel: (id: string) => void; onDetail: (b: Booking) => void }> = ({ bookings, onConfirm, onCancel, onDetail }) => (
    <Table hoverable>
        <Table.Head>
            <Table.HeadCell>ลำดับ</Table.HeadCell>
            <Table.HeadCell>ผู้จอง</Table.HeadCell>
            <Table.HeadCell>สนามกีฬา</Table.HeadCell>
            <Table.HeadCell>อุปกรณ์</Table.HeadCell>
            <Table.HeadCell>วันที่ & เวลา</Table.HeadCell>
            <Table.HeadCell className="text-center">ไฟล์แนบ</Table.HeadCell>
            <Table.HeadCell className="text-center">การจัดการ</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
            {bookings.length === 0 ? (
                <Table.Row><Table.Cell colSpan={6} className="text-center py-10 text-gray-500">ไม่มีข้อมูลรอการยืนยัน</Table.Cell></Table.Row>
            ) : (
                bookings.map((booking, index) => (
                    <Table.Row key={booking.id} className="bg-white">
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>
                            <p className="font-bold text-gray-900">{booking.User?.fullname || "ไม่พบชื่อผู้ใช้"}</p>
                            <p className="text-xs text-gray-500">{booking.User?.email || "-"}</p>
                            <p className="text-xs text-gray-500">{booking.User?.phoneNumber || "-"}</p>
                        </Table.Cell>
                        <Table.Cell>
                            <div className="font-medium">
                                {booking.Stadium?.nameStadium || "ไม่ระบุสนาม"}
                            </div>

                            {booking.Buildings && booking.Buildings.length > 0 && (
                                <div className="text-xs text-gray-500">
                                    อาคาร: {booking.Buildings.map((b) => b.name).join(", ") || "-"}
                                </div>
                            )}
                            <div className="text-xs text-gray-500">
                                กิจกรรม: {booking.activityName || "-"}
                            </div>
                        </Table.Cell>
                        <Table.Cell>
                            <ul className="text-xs list-disc pl-4 text-gray-600">
                                {booking.Equipment.map((item, idx) => (
                                    <li key={idx}>{item.name} ({item.BookingEquipment?.quantity ?? 0})</li>
                                ))}
                            </ul>
                        </Table.Cell>
                        <Table.Cell className="text-xs">
                            <div className="flex flex-col">
                                <span className="font-medium text-blue-600">{new Date(booking.startDate).toLocaleDateString("th-TH")} - {new Date(booking.endDate).toLocaleDateString("th-TH")}</span>
                                <span className="text-gray-500">{booking.startTime} - {booking.endTime}</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell className="text-center">
                            {booking.filePath && (
                                <a
                                    href={`http://localhost:5008${booking.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                                >
                                    ดูไฟล์
                                </a>
                            )}
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
                                <Dropdown.Item onClick={() => onDetail(booking)} className="text-blue-600 gap-2">
                                    <Icon icon="solar:eye-bold" /> ดูรายละเอียด
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => onConfirm(booking.id)} className="text-green-600 gap-2">
                                    <Icon icon="solar:check-circle-bold" /> ยืนยัน
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => onCancel(booking.id)} className="text-red-600 gap-2">
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

const BookingTableConfirmed: React.FC<{ bookings: Booking[]; onReset: (id: string) => void; onDetail: (b: Booking) => void }> = ({ bookings, onReset, onDetail }) => (
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
                    <Table.Row key={booking.id}>
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>
                            <p className="font-medium">{booking.User?.fullname || "N/A"}</p>
                            <small className="text-gray-400">{booking.User?.email || "-"}</small>
                            <div className="text-xs text-gray-400">{booking.User?.phoneNumber || "-"}</div>
                        </Table.Cell>
                        <Table.Cell>
                            <div className="font-medium">
                                {booking.Stadium?.nameStadium || "-"}
                            </div>

                            {booking.Buildings && booking.Buildings.length > 0 && (
                                <div className="text-xs text-gray-500">
                                    อาคาร: {booking.Buildings.map((b) => b.name).join(", ") || "-"}
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
                                <Dropdown.Item onClick={() => onDetail(booking)} className="text-blue-600 gap-2">
                                    <Icon icon="solar:eye-bold" /> ดูรายละเอียด
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => onReset(booking.id)} className="text-indigo-600 gap-2">
                                    <Icon icon="solar:refresh-outline" /> ส่งเสร็จสิ้น
                                </Dropdown.Item>
                            </Dropdown>
                        </Table.Cell>
                    </Table.Row>
                ))
            )}
        </Table.Body>
    </Table>
);

const BookingTableCanceled: React.FC<{ bookings: Booking[]; onDetail: (b: Booking) => void }> = ({ bookings, onDetail }) => (
    <Table hoverable>
        <Table.Head>
            <Table.HeadCell>ลำดับ</Table.HeadCell>
            <Table.HeadCell>ผู้จอง</Table.HeadCell>
            <Table.HeadCell>สนามกีฬา</Table.HeadCell>
            <Table.HeadCell>วันที่</Table.HeadCell>
            <Table.HeadCell>สถานะ</Table.HeadCell>
            <Table.HeadCell className="text-center">รายละเอียด</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
            {bookings.map((booking, index) => (
                <Table.Row key={booking.id} className="opacity-70 bg-gray-50">
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell>{booking.User?.fullname || "N/A"}</Table.Cell>
                    <Table.Cell>{booking.Stadium?.nameStadium}</Table.Cell>
                    <Table.Cell className="text-xs">{new Date(booking.startDate).toLocaleDateString("th-TH")}</Table.Cell>
                    <Table.Cell><span className="text-red-500 font-bold uppercase text-[10px]">Canceled</span></Table.Cell>
                    <Table.Cell className="text-center">
                        <button
                            onClick={() => onDetail(booking)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="ดูรายละเอียด"
                        >
                            <Icon icon="solar:eye-bold" className="w-5 h-5" />
                        </button>
                    </Table.Cell>
                </Table.Row>
            ))}
        </Table.Body>
    </Table>
);

// ─── Booking Detail Modal ─────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    pending:          { label: "รอการยืนยัน",    cls: "bg-yellow-100 text-yellow-700" },
    confirmed:        { label: "ยืนยันแล้ว",       cls: "bg-green-100 text-green-700" },
    canceled:         { label: "ยกเลิกแล้ว",       cls: "bg-red-100 text-red-600" },
    "Return Success": { label: "เสร็จสิ้นเรียบร้อย", cls: "bg-blue-100 text-blue-700" },
};

const BookingDetailModal: React.FC<{
    booking: Booking;
    onClose: () => void;
    onConfirm: (id: string) => void;
    onCancel: (id: string) => void;
    onReset: (id: string) => void;
}> = ({ booking, onClose, onConfirm, onCancel, onReset }) => {
    const statusInfo = STATUS_LABEL[booking.status] ?? { label: booking.status, cls: "bg-gray-100 text-gray-600" };

    const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
        <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className="w-36 shrink-0 text-xs text-gray-400 pt-0.5">{label}</span>
            <span className="text-sm text-gray-800 flex-1">{value || "-"}</span>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-kanit"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-800">รายละเอียดการจอง</h2>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.cls}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

                    {/* ผู้จอง */}
                    <section>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ข้อมูลผู้จอง</p>
                        <div className="bg-gray-50 rounded-xl px-4 py-1">
                            <Row label="ชื่อ-นามสกุล"  value={booking.User?.fullname} />
                            <Row label="อีเมล"          value={booking.User?.email} />
                            <Row label="เบอร์โทร"       value={booking.User?.phoneNumber} />
                            <Row label="สาขาวิชา"       value={booking.User?.fieldOfStudy} />
                            <Row label="ปีการศึกษา"     value={booking.User?.year} />
                        </div>
                    </section>

                    {/* สนาม */}
                    <section>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ข้อมูลการจอง</p>
                        <div className="bg-gray-50 rounded-xl px-4 py-1">
                            <Row label="สนามกีฬา"    value={booking.Stadium?.nameStadium} />
                            <Row label="อาคาร/สถานที่" value={booking.Buildings?.map((b) => b.name).join(", ")} />
                            <Row label="กิจกรรม"     value={booking.activityName} />
                            <Row label="วันที่เริ่ม"  value={new Date(booking.startDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })} />
                            <Row label="วันที่สิ้นสุด" value={new Date(booking.endDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })} />
                            <Row label="เวลา"        value={`${booking.startTime} – ${booking.endTime}`} />
                        </div>
                    </section>

                    {/* อุปกรณ์ */}
                    {booking.Equipment?.length > 0 && (
                        <section>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">อุปกรณ์ที่จอง</p>
                            <div className="bg-gray-50 rounded-xl px-4 py-2 space-y-1">
                                {booking.Equipment.map((eq, i) => (
                                    <div key={i} className="flex justify-between text-sm text-gray-700">
                                        <span>{eq.name}</span>
                                        <span className="text-gray-500">{eq.BookingEquipment?.quantity ?? 0} ชิ้น</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ไฟล์แนบ */}
                    {booking.filePath && (
                        <section>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ไฟล์แนบ</p>
                            <a
                                href={`${API_BASE}${booking.filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition"
                            >
                                <Icon icon="solar:file-download-bold" className="w-4 h-4" />
                                ดูไฟล์แนบ
                            </a>
                        </section>
                    )}

                    {/* เหตุผลยกเลิก */}
                    {booking.status === "canceled" && booking.cancelReason && (
                        <section>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">เหตุผลการยกเลิก</p>
                            <div className="bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                                {booking.cancelReason}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer — action buttons ตาม status */}
                <div className="px-6 py-4 border-t flex justify-between items-center gap-3">
                    <div className="flex gap-2">
                        {booking.status === "pending" && (
                            <>
                                <button
                                    onClick={() => onConfirm(booking.id)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                    ✓ ยืนยันการจอง
                                </button>
                                <button
                                    onClick={() => onCancel(booking.id)}
                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium rounded-lg transition"
                                >
                                    ✕ ยกเลิก
                                </button>
                            </>
                        )}
                        {booking.status === "confirmed" && (
                            <button
                                onClick={() => onReset(booking.id)}
                                className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium rounded-lg transition"
                            >
                                ↩ ส่งเสร็จสิ้น
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
