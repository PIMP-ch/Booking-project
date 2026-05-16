"use client";

import React, { useEffect, useState } from "react";
import { Badge, Dropdown, Modal, Button, TextInput, Table } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";
import { getAllStaff, deleteStaff, createStaff, updateStaff } from "@/utils/api";
import UploadAvatar from "@/app/components/dashboard/UploadAvatar";

interface ExecutiveHistory {
  id: string;
  staffId: string;
  startDate: string;
  endDate?: string;
}

interface Staff {
  id: string;
  fullname: string;
  email: string;
  role: string;
  password?: string;
  avatarUrl?: string;
  executiveHistories?: ExecutiveHistory[];
}

const StaffPage = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    role: "staff",
    password: "",
  });

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  // ── ไม่แสดง superadmin ในตาราง ──
  const filteredStaff = staffList.filter((s) => s.role !== "superadmin");

  const openConfirmModal = (id: string) => setConfirmModal({ isOpen: true, id });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, id: null });

  const fetchStaff = async () => {
    try {
      const data = await getAllStaff();
      setStaffList(data);
    } catch (err) {
      console.error("Failed to fetch staff data:", err);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmModal.id) return;
    try {
      await deleteStaff(confirmModal.id);
      fetchStaff();
      closeConfirmModal();
    } catch (err) {
      console.error("Failed to delete staff:", err);
    }
  };

  const handleSave = async () => {
    try {
      if (currentStaff?.id) {
        await updateStaff(currentStaff.id, form);
      } else {
        await createStaff(form);
      }
      fetchStaff();
      closeModal();
    } catch (err) {
      console.error("Failed to save staff:", err);
    }
  };

  const openModal = (staff: Staff | null = null) => {
    setCurrentStaff(staff);
    if (staff) {
      setForm({
        fullname: staff.fullname,
        email: staff.email,
        role: staff.role,
        password: "",
      });
    } else {
      setForm({
        fullname: "",
        email: "",
        role: "staff",
        password: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStaff(null);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="rounded-lg dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 font-kanit relative w-full break-words">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-xl font-bold">จัดการพนักงาน</h5>
        <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white">
          สร้างพนักงาน
        </Button>
      </div>

      <div className="mt-3 font-kanit">
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell className="p-6">รูป</Table.HeadCell>
              <Table.HeadCell>ชื่อเต็ม</Table.HeadCell>
              <Table.HeadCell>อีเมล</Table.HeadCell>
              <Table.HeadCell>ประเภท</Table.HeadCell>
              <Table.HeadCell></Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {filteredStaff.map((staff) => (
                <Table.Row key={staff.id}>
                  <Table.Cell>
                    <UploadAvatar
                      staffId={staff.id}
                      currentAvatar={staff.avatarUrl}
                      onUploaded={fetchStaff}
                    />
                  </Table.Cell>
                  <Table.Cell>{staff.fullname}</Table.Cell>
                  <Table.Cell>{staff.email}</Table.Cell>
                  <Table.Cell>
                    <Badge color="info" className="text-info">
                      {staff.role}
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
                      <Dropdown.Item className="flex gap-3" onClick={() => openModal(staff)}>
                        <Icon icon="solar:pen-new-square-broken" height={18} />
                        <span>แก้ไข</span>
                      </Dropdown.Item>
                      <Dropdown.Item className="flex gap-3" onClick={() => openConfirmModal(staff.id)}>
                        <Icon icon="solar:trash-bin-minimalistic-outline" height={18} />
                        <span>ลบ</span>
                      </Dropdown.Item>
                    </Dropdown>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </div>

      {/* Modal ยืนยันลบ */}
      <Modal className="font-kanit" show={confirmModal.isOpen} onClose={closeConfirmModal}>
        <Modal.Header>ยืนยันการลบ</Modal.Header>
        <Modal.Body>คุณต้องการลบพนักงานนี้จริงหรือไม่?</Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={handleDeleteConfirmed}>ลบ</Button>
          <Button color="gray" onClick={closeConfirmModal}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal เพิ่ม/แก้ไขพนักงาน */}
      <Modal className="font-kanit" show={isModalOpen} onClose={closeModal}>
        <Modal.Header>{currentStaff ? "แก้ไขพนักงาน" : "สร้างพนักงานใหม่"}</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col gap-4">
            <TextInput
              placeholder="ชื่อเต็ม"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
            />
            <TextInput
              placeholder="อีเมล"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                บทบาท
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {!currentStaff && (
              <TextInput
                placeholder="รหัสผ่าน"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            {currentStaff ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน"}
          </Button>
          <Button color="failure" onClick={closeModal}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffPage;
