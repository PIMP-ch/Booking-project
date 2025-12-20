"use client";

import React, { useState, useEffect } from "react";
import { Table, Modal, Button, Dropdown, TextInput } from "flowbite-react";
import { getAllEquipment, createEquipment, updateEquipment, deleteEquipment } from "@/utils/api";
import { Icon } from "@iconify/react";

interface Equipment {
    _id: string;
    name: string;
    quantity: number;
    status: string;
}

const EquipmentPage = () => {
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });
    const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
    const [form, setForm] = useState({ name: "", quantity: 0, status: "available" });

    // Fetch all equipment
    const fetchEquipment = async () => {
        try {
            const data = await getAllEquipment();
            setEquipmentList(data);
        } catch (err) {
            console.error("Failed to fetch equipment:", err);
        }
    };

    // Save equipment
    const handleSave = async () => {
        try {
            if (currentEquipment) {
                await updateEquipment(currentEquipment._id, form);
            } else {
                await createEquipment({ ...form, status: "available" });
            }
            fetchEquipment();
            closeModal();
        } catch (err) {
            console.error("Failed to save equipment:", err);
        }
    };

    // Confirm delete
    const handleDeleteConfirmed = async () => {
        if (!confirmModal.id) return;
        try {
            await deleteEquipment(confirmModal.id);
            fetchEquipment();
            closeConfirmModal();
        } catch (err) {
            console.error("Failed to delete equipment:", err);
        }
    };

    // Open modal for editing or adding
    const openModal = (equipment: Equipment | null = null) => {
        setCurrentEquipment(equipment);
        setForm(
            equipment
                ? { name: equipment.name, quantity: equipment.quantity, status: equipment.status }
                : { name: "", quantity: 0, status: "available" }
        );
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentEquipment(null);
    };

    const openConfirmModal = (id: string) => {
        setConfirmModal({ isOpen: true, id });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, id: null });
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md font-kanit">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">จัดการอุปกรณ์</h2>
                <Button onClick={() => openModal()} className="bg-blue-500 text-white">
                    เพิ่มอุปกรณ์
                </Button>
            </div>
            <Table hoverable>
                <Table.Head>
                    <Table.HeadCell>ลำดับ</Table.HeadCell>
                    <Table.HeadCell>ชื่ออุปกรณ์</Table.HeadCell>
                    <Table.HeadCell>จำนวน</Table.HeadCell>
                    <Table.HeadCell>สถานะ</Table.HeadCell>
                    <Table.HeadCell></Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {equipmentList.map((equipment, index) => (
                        <Table.Row key={equipment._id}>
                            <Table.Cell>{index + 1}</Table.Cell>
                            <Table.Cell>{equipment.name}</Table.Cell>
                            <Table.Cell>{equipment.quantity}</Table.Cell>
                            <Table.Cell>
                                <span
                                    className={`px-2 py-1 rounded-lg text-white ${equipment.status === "available" ? "bg-green-500" : "bg-red-500"
                                        }`}
                                >
                                    {equipment.status === "available" ? "ใช้งานได้" : "ปิดใช้งาน"}
                                </span>
                            </Table.Cell>

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
                                    <Dropdown.Item
                                        className="flex gap-2 items-center"
                                        onClick={() => openModal(equipment)}
                                    >
                                        <Icon icon="solar:pen-new-square-broken" height={18} />
                                        <span>แก้ไข</span>
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        className="flex gap-2 items-center"
                                        onClick={() => openConfirmModal(equipment._id)}
                                    >
                                        <Icon icon="solar:trash-bin-minimalistic-outline" height={18} />
                                        <span>ลบ</span>
                                    </Dropdown.Item>
                                </Dropdown>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            <Modal className="font-kanit" show={isModalOpen} onClose={closeModal}>
                <Modal.Header>{currentEquipment ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์"}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <TextInput
                            placeholder="ชื่ออุปกรณ์"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <TextInput
                            placeholder="จำนวน"
                            type="number"
                            value={form.quantity === 0 ? "" : form.quantity} // แสดงค่าว่างถ้า value เป็น 0
                            onChange={(e) => setForm({ ...form, quantity: e.target.value === "" ? 0 : Number(e.target.value) })}
                        />

                        {currentEquipment && (
                            <div>
                                <label className="block text-sm font-medium mb-1">สถานะ</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="available">ใช้งานได้</option>
                                    <option value="unavailable">ปิดใช้งาน</option>
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
                        {currentEquipment ? "บันทึกการแก้ไข" : "เพิ่มอุปกรณ์"}
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
                <Modal.Body>คุณต้องการลบอุปกรณ์นี้จริงหรือไม่?</Modal.Body>
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

export default EquipmentPage;
