"use client";

import React, { useState, useEffect } from "react";
import { Table, Modal, Button, Dropdown, TextInput } from "flowbite-react";
import { Icon } from "@iconify/react";
import { getAllStadiums, createStadium, updateStadium, deleteStadium } from "@/utils/api";

interface Stadium {
    _id: string;
    nameStadium: string;
    descriptionStadium: string;
    contactStadium: string;
    statusStadium: string;
}

const StadiumPage = () => {
    const [stadiumList, setStadiumList] = useState<Stadium[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });
    const [currentStadium, setCurrentStadium] = useState<Stadium | null>(null);
    const [form, setForm] = useState({
        nameStadium: "",
        descriptionStadium: "",
        contactStadium: "",
        statusStadium: "active",
    });

    // Fetch all stadiums
    const fetchStadiums = async () => {
        try {
            const data = await getAllStadiums();
            setStadiumList(data);
        } catch (err) {
            console.error("Failed to fetch stadiums:", err);
        }
    };

    // Save stadium
    const handleSave = async () => {
        try {
            if (currentStadium) {
                await updateStadium(currentStadium._id, form);
            } else {
                await createStadium({ ...form, statusStadium: "active" });
            }
            fetchStadiums();
            closeModal();
        } catch (err) {
            console.error("Failed to save stadium:", err);
        }
    };

    // Confirm delete
    const handleDeleteConfirmed = async () => {
        if (!confirmModal.id) return;
        try {
            await deleteStadium(confirmModal.id);
            fetchStadiums();
            closeConfirmModal();
        } catch (err) {
            console.error("Failed to delete stadium:", err);
        }
    };

    // Open modal for editing or adding
    const openModal = (stadium: Stadium | null = null) => {
        setCurrentStadium(stadium);
        setForm(
            stadium
                ? {
                    nameStadium: stadium.nameStadium,
                    descriptionStadium: stadium.descriptionStadium,
                    contactStadium: stadium.contactStadium,
                    statusStadium: stadium.statusStadium,
                }
                : {
                    nameStadium: "",
                    descriptionStadium: "",
                    contactStadium: "",
                    statusStadium: "active",
                }
        );
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentStadium(null);
    };

    const openConfirmModal = (id: string) => {
        setConfirmModal({ isOpen: true, id });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, id: null });
    };

    useEffect(() => {
        fetchStadiums();
    }, []);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md font-kanit">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">จัดการสนามกีฬา</h2>
                <Button onClick={() => openModal()} className="bg-blue-500 text-white">
                    เพิ่มสนามกีฬา
                </Button>
            </div>
            <Table hoverable>
                <Table.Head>
                    <Table.HeadCell>ลำดับ</Table.HeadCell>
                    <Table.HeadCell>ชื่อสนามกีฬา</Table.HeadCell>
                    <Table.HeadCell>คำอธิบาย</Table.HeadCell>
                    <Table.HeadCell>เบอร์ติดต่อ</Table.HeadCell>
                    <Table.HeadCell>สถานะ</Table.HeadCell>
                    <Table.HeadCell></Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {stadiumList.map((stadium, index) => (
                        <Table.Row key={stadium._id}>
                            <Table.Cell>{index + 1}</Table.Cell>
                            <Table.Cell>{stadium.nameStadium}</Table.Cell>
                            <Table.Cell>{stadium.descriptionStadium}</Table.Cell>
                            <Table.Cell>{stadium.contactStadium}</Table.Cell>
                            <Table.Cell>
                                <span
                                    className={`px-2 py-1 rounded-lg text-white ${stadium.statusStadium === "active"
                                        ? "bg-green-500"
                                        : stadium.statusStadium === "IsBooking"
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                        }`}
                                >
                                    {stadium.statusStadium === "active"
                                        ? "เปิดใช้งาน"
                                        : stadium.statusStadium === "IsBooking"
                                            ? "กำลังใช้งาน"
                                            : "ปิดใช้งาน"}
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                {stadium.statusStadium !== "IsBooking" ? (
                                    <Dropdown
                                        label="..."
                                        renderTrigger={() => (
                                            <span className="h-9 w-9 flex justify-center items-center rounded-full hover:bg-gray-100 cursor-pointer">
                                                <Icon icon="lucide:more-vertical" />
                                            </span>
                                        )}
                                        dismissOnClick={false}
                                    >
                                        <Dropdown.Item
                                            className="flex gap-2 items-center"
                                            onClick={() => openModal(stadium)}
                                        >
                                            <Icon icon="solar:pen-new-square-broken" height={18} />
                                            <span>แก้ไข</span>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            className="flex gap-2 items-center"
                                            onClick={() => openConfirmModal(stadium._id)}
                                        >
                                            <Icon icon="solar:trash-bin-minimalistic-outline" height={18} />
                                            <span>ลบ</span>
                                        </Dropdown.Item>
                                    </Dropdown>
                                ) : (
                                    <span className="text-gray-500 text-sm">ไม่สามารถแก้ไขได้</span>
                                )}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            <Modal className="font-kanit" show={isModalOpen} onClose={closeModal}>
                <Modal.Header>{currentStadium ? "แก้ไขสนามกีฬา" : "เพิ่มสนามกีฬา"}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <TextInput
                            placeholder="ชื่อสนามกีฬา"
                            value={form.nameStadium}
                            onChange={(e) => setForm({ ...form, nameStadium: e.target.value })}
                        />
                        <TextInput
                            placeholder="คำอธิบาย"
                            value={form.descriptionStadium}
                            onChange={(e) =>
                                setForm({ ...form, descriptionStadium: e.target.value })
                            }
                        />
                        <TextInput
                            placeholder="เบอร์ติดต่อ"
                            value={form.contactStadium}
                            onChange={(e) =>
                                setForm({ ...form, contactStadium: e.target.value })
                            }
                        />
                        {currentStadium && (
                            <div>
                                <label className="block text-sm font-medium mb-1">สถานะ</label>
                                <select
                                    value={form.statusStadium}
                                    onChange={(e) =>
                                        setForm({ ...form, statusStadium: e.target.value })
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="active">เปิดใช้งาน</option>
                                    <option value="inactive">ปิดใช้งาน</option>
                                </select>
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        {currentStadium ? "บันทึกการแก้ไข" : "เพิ่มสนามกีฬา"}
                    </Button>
                    <Button
                        onClick={closeModal}
                        className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg"
                    >
                        ยกเลิก
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal className="font-kanit" show={confirmModal.isOpen} onClose={closeConfirmModal}>
                <Modal.Header>ยืนยันการลบ</Modal.Header>
                <Modal.Body>คุณต้องการลบสนามกีฬาแห่งนี้จริงหรือไม่?</Modal.Body>
                <Modal.Footer>
                    <Button
                        color="failure"
                        onClick={handleDeleteConfirmed}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        ลบ
                    </Button>
                    <Button
                        onClick={closeConfirmModal}
                        className="bg-gray-200 hover:bg-gray-300 text-black"
                    >
                        ยกเลิก
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default StadiumPage;
