"use client";

import React, { useEffect, useState } from "react";
import { Badge, Dropdown, Modal, Button, TextInput, Table, ToggleSwitch } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import {
  getBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from "@/utils/api";

interface Building {
  id: number;
  name: string;
  active: boolean;
  createdAt?: string;
}

const BuildingPage = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [current, setCurrent] = useState<Building | null>(null);
  const [form, setForm] = useState({ name: "", active: true });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });

  const fetchBuildings = async () => {
    try {
      const data = await getBuildings();
      setBuildings(Array.isArray(data) ? data : []);
    } catch {
      toast.error("โหลดข้อมูลอาคารไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const openModal = (building: Building | null = null) => {
    setCurrent(building);
    setForm(
      building
        ? { name: building.name, active: building.active }
        : { name: "", active: true }
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrent(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning("กรุณาระบุชื่ออาคาร");
      return;
    }
    try {
      if (current) {
        await updateBuilding(current.id, form);
        toast.success("แก้ไขอาคารสำเร็จ");
      } else {
        await createBuilding(form);
        toast.success("สร้างอาคารสำเร็จ");
      }
      fetchBuildings();
      closeModal();
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const openConfirmModal = (id: number) => setConfirmModal({ isOpen: true, id });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, id: null });

  const handleDeleteConfirmed = async () => {
    if (!confirmModal.id) return;
    try {
      await deleteBuilding(confirmModal.id);
      toast.success("ลบอาคารสำเร็จ");
      fetchBuildings();
      closeConfirmModal();
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  return (
    <div className="rounded-lg dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 font-kanit relative w-full break-words">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-xl font-bold">จัดการอาคารกีฬา</h5>
        <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white">
          เพิ่มอาคาร
        </Button>
      </div>

      <div className="mt-3">
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell className="p-6">#</Table.HeadCell>
              <Table.HeadCell>ชื่ออาคาร</Table.HeadCell>
              <Table.HeadCell>สถานะ</Table.HeadCell>
              <Table.HeadCell></Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {buildings.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4} className="text-center text-gray-400 py-8">
                    ไม่มีข้อมูลอาคาร
                  </Table.Cell>
                </Table.Row>
              ) : (
                buildings.map((b, i) => (
                  <Table.Row key={b.id}>
                    <Table.Cell className="p-6 font-medium">{i + 1}</Table.Cell>
                    <Table.Cell className="font-medium">{b.name}</Table.Cell>
                    <Table.Cell>
                      <Badge color={b.active ? "success" : "gray"}>
                        {b.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown
                        label=""
                        dismissOnClick={false}
                        renderTrigger={() => (
                          <span className="h-9 w-9 flex justify-center items-center rounded-full hover:bg-lightprimary hover:text-primary cursor-pointer">
                            <HiOutlineDotsVertical size={22} />
                          </span>
                        )}
                      >
                        <Dropdown.Item className="flex gap-3" onClick={() => openModal(b)}>
                          <Icon icon="solar:pen-new-square-broken" height={18} />
                          <span>แก้ไข</span>
                        </Dropdown.Item>
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </div>

      {/* Modal ยืนยันลบ */}
      <Modal className="font-kanit" show={confirmModal.isOpen} onClose={closeConfirmModal}>
        <Modal.Header>ยืนยันการลบ</Modal.Header>
        <Modal.Body>คุณต้องการลบอาคารนี้จริงหรือไม่?</Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={handleDeleteConfirmed}>ลบ</Button>
          <Button color="gray" onClick={closeConfirmModal}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal เพิ่ม/แก้ไขอาคาร */}
      <Modal className="font-kanit" show={isModalOpen} onClose={closeModal}>
        <Modal.Header>{current ? "แก้ไขอาคาร" : "เพิ่มอาคารใหม่"}</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-white">
                ชื่ออาคาร <span className="text-red-500">*</span>
              </label>
              <TextInput
                placeholder="กรอกชื่ออาคารกีฬา"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-white">
                สถานะการใช้งาน
              </label>
              <ToggleSwitch
                checked={form.active}
                onChange={(val) => setForm({ ...form, active: val })}
                label={form.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            {current ? "บันทึกการแก้ไข" : "เพิ่มอาคาร"}
          </Button>
          <Button color="failure" onClick={closeModal}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BuildingPage;
