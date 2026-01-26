"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Table, Modal, Button, TextInput, Label, Dropdown } from "flowbite-react";
import {
    getAllStadiums,
    createStadium,
    updateStadium,
    deleteStadium,
    getBuildings,
    uploadStadiumImages, // เปลี่ยนให้ตรงกับ api.js (เดิมคือ uploadStadiumImage)
    deleteStadiumImage,
} from "@/utils/api";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

interface Stadium {
    _id: string;
    nameStadium: string;
    descriptionStadium: string;
    contactStadium: string;
    statusStadium: string;
    imageUrl: string[];
    buildingIds?: string[];
}

const INITIAL_FORM = {
    nameStadium: "",
    descriptionStadium: "",
    contactStadium: "",
    statusStadium: "active",
    buildingIds: [] as string[],
};

const StadiumPage = () => {
    // --- States ---
    const [stadiumList, setStadiumList] = useState<Stadium[]>([]);
    const [buildings, setBuildings] = useState<{ _id: string; name: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStadium, setCurrentStadium] = useState<Stadium | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });

    const [form, setForm] = useState(INITIAL_FORM);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [externalImageUrls, setExternalImageUrls] = useState<string[]>([]);


    // --- Actions ---
    const fetchData = useCallback(async () => {
        try {
            const [stadiumData, buildingData] = await Promise.all([
                getAllStadiums(),
                getBuildings(),
            ]);
            setStadiumList(stadiumData);
            setBuildings(buildingData);
        } catch (err) {
            toast.error("โหลดข้อมูลไม่สำเร็จ");
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (stadium: Stadium | null = null) => {
        setCurrentStadium(stadium);
        if (stadium) {
            setForm({
                nameStadium: stadium.nameStadium,
                descriptionStadium: stadium.descriptionStadium,
                contactStadium: stadium.contactStadium,
                statusStadium: stadium.statusStadium,
                buildingIds: stadium.buildingIds || [],
            });
            // แสดง Preview ถ้ารูปภาพมีอยู่
            setImagePreview(stadium.imageUrl?.[0] ? `${API_BASE}${stadium.imageUrl[0]}` : "");
        } else {
            setForm(INITIAL_FORM);
            setImagePreview("");
        }
        setImageFiles([]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentStadium(null);
        setForm(INITIAL_FORM);
        setImagePreview("");
        setImageFiles([]);
    };

    // ฟังก์ชันลบรูปภาพ (ปรับปรุงให้ใช้ได้ทั้งหน้าตารางและใน Modal แก้ไข)
    const handleDeleteImage = async (id: string, isFromModal: boolean = false) => {
        if (!window.confirm("คุณต้องการลบรูปภาพนี้ออกจากระบบใช่หรือไม่?")) return;
        try {
            await deleteStadiumImage(id, 0); // ส่ง index 0 เพื่อลบรูปแรก
            toast.success("ลบรูปภาพสำเร็จ");

            if (isFromModal) {
                setImagePreview(""); // ลบ Preview ในหน้าแก้ไขทันที
            }
            fetchData(); // รีเฟรชข้อมูลในตาราง
        } catch (err: any) {
            toast.error(err.message || "ไม่สามารถลบรูปภาพได้");
        }
    };

    const handleTableUpload = async (id: string, file: File) => {
        try {
            toast.info("กำลังอัปโหลด...");
            await uploadStadiumImages(id, [file]);
            toast.success("เปลี่ยนรูปภาพสำเร็จ");
            fetchData();
        } catch (err) {
            toast.error("อัปโหลดไม่สำเร็จ");
        }
    };

    const handleSave = async () => {
        if (!form.nameStadium.trim()) {
            toast.warn("กรุณากรอกชื่อสนามกีฬา");
            return;
        }

        try {
            setIsSaving(true);
            let stadiumId = currentStadium?._id;

            if (currentStadium) {
                await updateStadium(currentStadium._id, form);
            } else {
                const res = await createStadium(form);
                stadiumId = res.stadium._id;
            }

            // ถ้ามีการเลือกไฟล์ใหม่ ให้ทำการอัปโหลด
            if (stadiumId &&
                (imageFiles.length > 0 || externalImageUrls.length > 0)
            ) {
                await uploadStadiumImages(
                    stadiumId,
                    imageFiles,
                    externalImageUrls
                );
            }

            toast.success("บันทึกข้อมูลเรียบร้อย");
            fetchData();
            closeModal();
        } catch (err) {
            toast.error("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 font-kanit bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">จัดการสนามกีฬา</h2>
                <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                    <Icon icon="solar:add-circle-bold" className="mr-2 h-5 w-5" />
                    เพิ่มสนามกีฬา
                </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <Table hoverable>
                    <Table.Head className="bg-gray-50 text-gray-600">
                        <Table.HeadCell>รูป</Table.HeadCell>
                        <Table.HeadCell>ลำดับ</Table.HeadCell>
                        <Table.HeadCell>ชื่อสนาม</Table.HeadCell>
                        <Table.HeadCell>เบอร์ติดต่อ</Table.HeadCell>
                        <Table.HeadCell>สถานะ</Table.HeadCell>
                        <Table.HeadCell></Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {stadiumList.map((stadium, index) => (
                            <Table.Row key={stadium._id} className="bg-white">
                                <Table.Cell className="w-[300px]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border flex-shrink-0">
                                            <img
                                                src={stadium.imageUrl?.[0] ? `${API_BASE}${stadium.imageUrl[0]}` : "/no-image.png"}
                                                className="w-full h-full object-cover"
                                                alt="stadium"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="bg-[#1e293b] text-white text-[11px] px-3 py-1.5 rounded-md cursor-pointer hover:bg-slate-700 text-center font-medium transition-colors">
                                                Choose File
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleTableUpload(stadium._id, file);
                                                    }}
                                                />
                                            </label>
                                            {stadium.imageUrl?.length > 0 && (
                                                <button
                                                    onClick={() => handleDeleteImage(stadium._id)}
                                                    className="text-red-500 text-[10px] text-left hover:underline pl-1"
                                                >
                                                    ลบรูป
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>{index + 1}</Table.Cell>
                                <Table.Cell className="font-semibold text-gray-800">{stadium.nameStadium}</Table.Cell>
                                <Table.Cell>{stadium.contactStadium}</Table.Cell>
                                <Table.Cell>
                                    <span className={`px-4 py-1 rounded-full text-[12px] text-white font-medium ${stadium.statusStadium === "active" ? "bg-[#10b981]" :
                                        stadium.statusStadium === "IsBooking" ? "bg-[#d97706]" : "bg-red-500"
                                        }`}>
                                        {stadium.statusStadium === "active" ? "เปิดใช้งาน" :
                                            stadium.statusStadium === "IsBooking" ? "กำลังใช้งาน" : "ปิดใช้งาน"}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Dropdown label="" renderTrigger={() => (
                                        <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-all w-fit">
                                            <Icon icon="lucide:more-vertical" className="text-gray-400" />
                                        </div>
                                    )} inline>
                                        <Dropdown.Item onClick={() => openModal(stadium)}>แก้ไข</Dropdown.Item>
                                        <Dropdown.Item onClick={() => setConfirmModal({ isOpen: true, id: stadium._id })} className="text-red-600">ลบ</Dropdown.Item>
                                    </Dropdown>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>

            {/* Modal Add/Edit */}
            <Modal show={isModalOpen} onClose={closeModal} size="md" className="font-kanit">
                <Modal.Header className="border-b-0 pb-0 pt-6 px-8 text-xl font-bold">
                    {currentStadium ? "แก้ไขสนามกีฬา" : "เพิ่มสนามกีฬา"}
                </Modal.Header>
                <Modal.Body className="px-8 pb-8">
                    <div className="space-y-4">
                        <TextInput
                            value={form.nameStadium}
                            onChange={(e) => setForm({ ...form, nameStadium: e.target.value })}
                            placeholder="ชื่อสนามกีฬา"
                        />
                        <TextInput
                            value={form.descriptionStadium}
                            onChange={(e) => setForm({ ...form, descriptionStadium: e.target.value })}
                            placeholder="คำอธิบายสนาม"
                        />
                        <TextInput
                            value={form.contactStadium}
                            onChange={(e) => setForm({ ...form, contactStadium: e.target.value })}
                            placeholder="เบอร์ติดต่อ"
                        />

                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500">อาคารที่เกี่ยวข้อง</Label>
                            <div className="max-h-32 overflow-y-auto border rounded-xl p-3 bg-gray-50 space-y-2">
                                {buildings.map((b) => (
                                    <label key={b._id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.buildingIds.includes(b._id)}
                                            onChange={(e) => {
                                                const next = e.target.checked
                                                    ? [...form.buildingIds, b._id]
                                                    : form.buildingIds.filter((id) => id !== b._id);
                                                setForm({ ...form, buildingIds: next });
                                            }}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{b.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                            <Label className="text-gray-500 mb-2 block text-xs">รูปสนามกีฬา</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-white">
                                    <img src={imagePreview || "/no-image.png"} className="w-full h-full object-cover" alt="preview" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="bg-[#1e293b] text-white text-[11px] px-4 py-1.5 rounded-md cursor-pointer hover:bg-slate-700 font-medium">
                                        Choose File
                                        <input type="file" className="hidden" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setImageFiles([file]);
                                                setImagePreview(URL.createObjectURL(file));
                                            }
                                        }} />
                                    </label>

                                    {/* ปรับปรุง Logic ปุ่มลบรูปใน Modal */}
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (currentStadium && currentStadium.imageUrl?.length > 0 && imagePreview.includes(API_BASE)) {
                                                    // ลบจาก Database จริง
                                                    handleDeleteImage(currentStadium._id, true);
                                                } else {
                                                    // แค่ล้างรูปที่เพิ่งเลือกมา (ยังไม่บันทึก)
                                                    setImagePreview("");
                                                    setImageFiles([]);
                                                }
                                            }}
                                            className="text-red-500 text-[10px] text-left hover:underline"
                                        >
                                            {currentStadium && imagePreview.includes(API_BASE) ? "ลบรูป" : "ล้างรูปที่เลือก"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {currentStadium && (
                            <select
                                value={form.statusStadium}
                                onChange={(e) => setForm({ ...form, statusStadium: e.target.value })}
                                className="w-full rounded-xl border-gray-200 text-sm h-11 focus:ring-blue-500"
                            >
                                <option value="active">เปิดใช้งาน</option>
                                <option value="inactive">ปิดปรับปรุง</option>
                                <option value="IsBooking">กำลังใช้งาน</option>
                            </select>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-t-0 flex gap-3 px-8 pb-8 pt-0">
                    <Button onClick={handleSave} className="bg-[#2563eb] flex-1 rounded-2xl h-11" disabled={isSaving}>
                        {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </Button>
                    <Button color="gray" onClick={closeModal} className="flex-1 rounded-2xl h-11 border-none bg-gray-100 hover:bg-gray-200">
                        ยกเลิก
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal show={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, id: null })} size="sm">
                <Modal.Body className="text-center p-6 text-kanit">
                    <Icon icon="solar:danger-triangle-bold" className="mx-auto text-red-500 text-5xl mb-4" />
                    <h3 className="text-lg font-bold mb-6">ยืนยันการลบสนามกีฬา?</h3>
                    <div className="flex gap-3">
                        <Button color="failure" onClick={async () => {
                            if (confirmModal.id) {
                                try {
                                    await deleteStadium(confirmModal.id);
                                    toast.success("ลบข้อมูลสำเร็จ");
                                    fetchData();
                                } catch (err) {
                                    toast.error("ไม่สามารถลบได้เนื่องจากสนามถูกใช้งานอยู่");
                                }
                            }
                            setConfirmModal({ isOpen: false, id: null });
                        }} className="flex-1 rounded-xl">ลบ</Button>
                        <Button color="gray" onClick={() => setConfirmModal({ isOpen: false, id: null })} className="flex-1 rounded-xl">ยกเลิก</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default StadiumPage;