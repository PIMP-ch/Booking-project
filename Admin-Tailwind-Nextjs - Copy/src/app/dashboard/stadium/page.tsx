"use client";

import React, { useState, useEffect, useRef } from "react";
import { Table, Modal, Button, Dropdown, TextInput } from "flowbite-react";
import { Icon } from "@iconify/react";
import {
  getAllStadiums,
  createStadium,
  updateStadium,
  deleteStadium,
  uploadStadiumImage,
  deleteStadiumImage,
} from "@/utils/api";
import UploadStadiumImage from "src/app/components/dashboard/UploadStadiumImage";

interface Stadium {
  _id: string;
  nameStadium: string;
  descriptionStadium: string;
  contactStadium: string;
  statusStadium: string;
  imageUrl?: string; // ✅ เพิ่มฟิลด์รูป
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
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

  const resolveImageUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${API_BASE}${url}`;
  };

  const cleanupObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const setServerPreview = (relativePath?: string) => {
    cleanupObjectUrl();
    setImagePreview(resolveImageUrl(relativePath));
  };

  const handleImageSelection = (file: File | null) => {
    cleanupObjectUrl();
    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setImagePreview(url);
      setImageFile(file);
      setRemoveImage(false);
    } else {
      setImagePreview("");
      setImageFile(null);
    }
  };

  const handleRemoveImage = () => {
    cleanupObjectUrl();
    setImagePreview("");
    setImageFile(null);
    setRemoveImage(Boolean(currentStadium?.imageUrl));
  };

  // โหลดรายการสนาม
  const fetchStadiums = async () => {
    try {
      const data = await getAllStadiums();
      setStadiumList(data);
    } catch (err) {
      console.error("Failed to fetch stadiums:", err);
    }
  };

  useEffect(() => {
    return () => {
      cleanupObjectUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // บันทึกสนาม
  const handleSave = async () => {
    try {
      setIsSaving(true);
      let stadiumId: string | undefined;

      if (currentStadium) {
        const result = await updateStadium(currentStadium._id, form);
        stadiumId = result?.stadium?._id || currentStadium._id;
      } else {
        const result = await createStadium({ ...form, statusStadium: "active" });
        stadiumId = result?.stadium?._id || result?._id;
      }

      if (stadiumId) {
        if (imageFile) {
          await uploadStadiumImage(stadiumId, imageFile);
        } else if (removeImage) {
          await deleteStadiumImage(stadiumId);
        }
      }

      await fetchStadiums();
      closeModal();
    } catch (err) {
      console.error("Failed to save stadium:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ลบสนาม
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

  // เปิด/ปิดโมดัล
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
    setImageFile(null);
    setRemoveImage(false);
    setServerPreview(stadium?.imageUrl);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStadium(null);
    setForm({
      nameStadium: "",
      descriptionStadium: "",
      contactStadium: "",
      statusStadium: "active",
    });
    cleanupObjectUrl();
    setImagePreview("");
    setImageFile(null);
    setRemoveImage(false);
  };
  const openConfirmModal = (id: string) => setConfirmModal({ isOpen: true, id });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, id: null });

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
          <Table.HeadCell>รูป</Table.HeadCell> {/* ✅ คอลัมน์รูป */}
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
              <Table.Cell>
                <UploadStadiumImage
                  stadiumId={stadium._id}
                  currentImage={stadium.imageUrl}
                  onChanged={fetchStadiums} // รีเฟรชรายการหลังอัปโหลด/ลบ
                />
              </Table.Cell>

              <Table.Cell>{index + 1}</Table.Cell>
              <Table.Cell>{stadium.nameStadium}</Table.Cell>
              <Table.Cell>{stadium.descriptionStadium}</Table.Cell>
              <Table.Cell>{stadium.contactStadium}</Table.Cell>

              <Table.Cell>
                <span
                  className={`px-2 py-1 rounded-lg text-white ${
                    stadium.statusStadium === "active"
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

      {/* โมดัล เพิ่ม/แก้ไขสนาม */}
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
              onChange={(e) => setForm({ ...form, descriptionStadium: e.target.value })}
            />
            <TextInput
              placeholder="เบอร์ติดต่อ"
              value={form.contactStadium}
              onChange={(e) => setForm({ ...form, contactStadium: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium mb-1">รูปสนามกีฬา</label>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-md overflow-hidden border bg-gray-100">
                  {imagePreview ? (
                    <img src={imagePreview} alt="stadium preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">ไม่มีรูป</div>
                  )}
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelection(e.target.files?.[0] ?? null)}
                    disabled={isSaving}
                    className="text-xs"
                  />
                  {(imagePreview || (currentStadium?.imageUrl && !removeImage)) && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-500 text-xs hover:underline"
                      disabled={isSaving}
                    >
                      ลบรูป
                    </button>
                  )}
                  {removeImage && !imageFile && (
                    <span className="text-xs text-yellow-600">จะลบรูปเดิมหลังจากบันทึก</span>
                  )}
                </div>
              </div>
            </div>
            {currentStadium && (
              <div>
                <label className="block text-sm font-medium mb-1">สถานะ</label>
                <select
                  value={form.statusStadium}
                  onChange={(e) => setForm({ ...form, statusStadium: e.target.value })}
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
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {isSaving ? "กำลังบันทึก..." : currentStadium ? "บันทึกการแก้ไข" : "เพิ่มสนามกีฬา"}
          </Button>
          <Button
            onClick={closeModal}
            disabled={isSaving}
            className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg"
          >
            ยกเลิก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* โมดัลยืนยันลบ */}
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
