"use client";

import React, { useState, useEffect, useRef } from "react";
import { Table, Modal, Button, Dropdown, TextInput, Label } from "flowbite-react";
import {
    getAllEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    uploadEquipmentImage,
    deleteEquipmentImage,
} from "@/utils/api";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

interface Equipment {
    _id: string;
    name: string;
    quantity: number;
    status: string;
    imageUrl?: string;
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
    const [imagePreview, setImagePreview] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            const data = await getAllEquipment();
            setEquipmentList(data);
        } catch (err) {
            toast.error("โหลดข้อมูลไม่สำเร็จ");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (equipment: Equipment | null = null) => {
        setCurrentEquipment(equipment);
        setForm(
            equipment
                ? { name: equipment.name, quantity: equipment.quantity, status: equipment.status }
                : { name: "", quantity: 0, status: "available" }
        );
        setImagePreview(equipment?.imageUrl ? `${API_BASE}${equipment.imageUrl}` : "");
        setImageFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentEquipment(null);
        setImagePreview("");
        setImageFile(null);
    };

    const handleTableUpload = async (id: string, file: File) => {
        try {
            toast.info("กำลังอัปโหลด...");
            await uploadEquipmentImage(id, file);
            toast.success("เปลี่ยนรูปภาพสำเร็จ");
            fetchData();
        } catch (err) {
            toast.error("อัปโหลดไม่สำเร็จ");
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            let eqId = currentEquipment?._id;

            if (currentEquipment) {
                await updateEquipment(currentEquipment._id, form);
            } else {
                const res = await createEquipment(form);
                eqId = res._id || res.newEquipment?._id;
            }

            if (eqId && imageFile) {
                await uploadEquipmentImage(eqId, imageFile);
            }

            toast.success("บันทึกข้อมูลเรียบร้อย");
            fetchData();
            closeModal();
        } catch (err) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 font-kanit bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">จัดการอุปกรณ์</h2>
        <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
          <Icon icon="solar:add-circle-bold" className="mr-2 h-5 w-5" />
          เพิ่มอุปกรณ์
        </Button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <Table hoverable>
                    <Table.Head className="bg-gray-50 text-gray-600">
                        <Table.HeadCell>รูป</Table.HeadCell>
                        <Table.HeadCell>ลำดับ</Table.HeadCell>
                        <Table.HeadCell>ชื่ออุปกรณ์</Table.HeadCell>
                        <Table.HeadCell>จำนวน</Table.HeadCell>
                        <Table.HeadCell>สถานะ</Table.HeadCell>
                        <Table.HeadCell></Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {equipmentList.map((eq, index) => (
                            <Table.Row key={eq._id} className="bg-white">
                                <Table.Cell className="w-[300px]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border flex-shrink-0">
                                            <img
                                                src={eq.imageUrl ? `${API_BASE}${eq.imageUrl}` : "/no-image.png"}
                                                className="w-full h-full object-cover"
                                                alt="preview"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="bg-[#1e293b] text-white text-[11px] px-3 py-1.5 rounded-md cursor-pointer hover:bg-slate-700 text-center font-medium">
                                                Choose File
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleTableUpload(eq._id, file);
                                                    }}
                                                />
                                            </label>
                                            {eq.imageUrl && (
                                                <button
                                                    onClick={() => { if(confirm("ลบรูป?")) deleteEquipmentImage(eq._id).then(fetchData); }}
                                                    className="text-red-500 text-[10px] text-left hover:underline pl-1"
                                                >
                                                    ลบรูป
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>{index + 1}</Table.Cell>
                                <Table.Cell className="font-semibold text-gray-800">{eq.name}</Table.Cell>
                                <Table.Cell>{eq.quantity}</Table.Cell>
                                <Table.Cell>
                                    <span className={`px-4 py-1 rounded-full text-[12px] text-white font-medium ${
                                        eq.status === "available" ? "bg-[#10b981]" : "bg-[#d97706]"
                                    }`}>
                                        {eq.status === "available" ? "ใช้งานได้" : "กำลังใช้งาน"}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Dropdown label="" renderTrigger={() => (
                                        <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-all">
                                            <Icon icon="lucide:more-vertical" className="text-gray-400" />
                                        </div>
                                    )} inline>
                                        <Dropdown.Item onClick={() => openModal(eq)}>แก้ไข</Dropdown.Item>
                                        <Dropdown.Item onClick={() => setConfirmModal({isOpen: true, id: eq._id})} className="text-red-600">ลบ</Dropdown.Item>
                                    </Dropdown>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>

            {/* Modal Edit/Add - รูปแบบตามภาพที่ 1 */}
            <Modal show={isModalOpen} onClose={closeModal} size="md" className="font-kanit">
                <Modal.Header className="border-b-0 pb-0 pt-6 px-8 text-xl font-bold">
                    {currentEquipment ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์"}
                </Modal.Header>
                <Modal.Body className="px-8 pb-8">
                    <div className="space-y-5">
                        <TextInput 
                            value={form.name} 
                            onChange={(e) => setForm({...form, name: e.target.value})}
                            placeholder="ชื่ออุปกรณ์"
                            className="rounded-full"
                        />
                        <TextInput 
                            type="number"
                            value={form.quantity || ""}
                            onChange={(e) => setForm({...form, quantity: Number(e.target.value)})}
                            placeholder="จำนวน"
                        />
                        
                        <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                            <Label className="text-gray-500 mb-2 block text-xs">รูปอุปกรณ์</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-white">
                                    <img src={imagePreview || "/no-image.png"} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="bg-[#1e293b] text-white text-[11px] px-4 py-1.5 rounded-md cursor-pointer hover:bg-slate-700 font-medium">
                                        Choose File
                                        <input type="file" className="hidden" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if(file) {
                                                setImageFile(file);
                                                setImagePreview(URL.createObjectURL(file));
                                            }
                                        }} />
                                    </label>
                                    {(imagePreview || currentEquipment?.imageUrl) && (
                                        <button onClick={() => {setImagePreview(""); setImageFile(null);}} className="text-red-500 text-[10px] text-left hover:underline">ลบรูป</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {currentEquipment && (
                            <select 
                                value={form.status}
                                onChange={(e) => setForm({...form, status: e.target.value})}
                                className="w-full rounded-xl border-gray-200 text-sm h-11 focus:ring-blue-500"
                            >
                                <option value="available">ใช้งานได้</option>
                                <option value="unavailable">กำลังใช้งาน</option>
                            </select>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-t-0 flex gap-3 px-8 pb-8 pt-0">
                    <Button onClick={handleSave} className="bg-[#2563eb] flex-1 rounded-2xl h-11" disabled={isSaving}>
                        {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                    </Button>
                    <Button color="gray" onClick={closeModal} className="flex-1 rounded-2xl h-11 border-none bg-gray-100 hover:bg-gray-200">
                        ยกเลิก
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal show={confirmModal.isOpen} onClose={() => setConfirmModal({isOpen: false, id: null})} size="sm">
                <Modal.Body className="text-center p-6">
                    <Icon icon="solar:danger-triangle-bold" className="mx-auto text-red-500 text-5xl mb-4" />
                    <h3 className="text-lg font-bold mb-6">ยืนยันการลบอุปกรณ์?</h3>
                    <div className="flex gap-3">
                        <Button color="failure" onClick={async () => {
                            if(confirmModal.id) await deleteEquipment(confirmModal.id);
                            fetchData();
                            setConfirmModal({isOpen: false, id: null});
                        }} className="flex-1 rounded-xl">ลบ</Button>
                        <Button color="gray" onClick={() => setConfirmModal({isOpen: false, id: null})} className="flex-1 rounded-xl">ยกเลิก</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default EquipmentPage;