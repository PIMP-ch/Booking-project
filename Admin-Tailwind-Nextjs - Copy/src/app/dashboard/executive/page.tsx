"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Badge, Button, Dropdown, Modal, TextInput, Table, Spinner } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";
import { exportTableToPdf } from "@/utils/exportPdf";
import axios, { AxiosError } from "axios";
import UploadAvatar from "@/app/components/dashboard/UploadAvatar";
import { toast } from "react-toastify";

// ─── Types ───────────────────────────────────────────────
interface StaffInfo {
  id: number;
  fullname: string;
  email: string;
  avatarUrl?: string;
}

interface Executive {
  id: string;
  staffId: number;
  staff: StaffInfo;
  position: string;
  phone: string;
  status: "active" | "inactive";
  startDate: string;
  endDate?: string;
  pdfPath?: string;
}

// ─── Axios instance ───────────────────────────────────────
const api = axios.create({
  baseURL: "http://localhost:5008/api",
  headers: { "Content-Type": "application/json" },
});

const getErrorMessage = (err: unknown): string => {
  if (err instanceof AxiosError) {
    return err.response?.data?.message || err.message || "API error";
  }
  return "API error";
};

// ─── POSITIONS ────────────────────────────────────────────
const POSITIONS = ["ผู้อำนวยการ", "รองผู้อำนวยการ"];

// ─── Avatar Placeholder ───────────────────────────────────
const AvatarPlaceholder = ({ name }: { name: string }) => {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
      {initials}
    </div>
  );
};

// ─── Initial form states ──────────────────────────────────
const EMPTY_CREATE_FORM = {
  fullname: "",
  email: "",
  password: "",
  position: "",
  phone: "",
  status: "active" as "active" | "inactive",
  startDate: "",
  endDate: "",
};

const EMPTY_EDIT_FORM = {
  position: "",
  phone: "",
  status: "active" as "active" | "inactive",
  startDate: "",
  endDate: "",
};

// ─── Main Component ──────────────────────────────────────
const ExecutivePage = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPosition, setFilterPosition] = useState("ทั้งหมด");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExec, setCurrentExec] = useState<Executive | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // ─── Fetch ────────────────────────────────────────────
  const fetchExecutives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Executive[]>("/executives");
      setExecutives(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutives();
  }, [fetchExecutives]);

  // ─── Filter ────────────────────────────────────────────
  const filtered = useMemo(() => {
    return executives.filter((exec) => {
      const matchSearch =
        exec.staff?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exec.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPosition = filterPosition === "ทั้งหมด" || exec.position === filterPosition;
      return matchSearch && matchPosition;
    });
  }, [executives, searchQuery, filterPosition]);

  const uniquePositions = useMemo(() => {
    const positions = [...new Set(executives.map((e) => e.position))];
    return ["ทั้งหมด", ...positions];
  }, [executives]);

  // ─── Export ────────────────────────────────────────────
  const handleExportPdf = async () => {
    await exportTableToPdf({
      title: "รายงานผู้บริหาร",
      filename: "executives.pdf",
      headers: ["ชื่อ", "อีเมล", "ตำแหน่ง", "เบอร์โทรศัพท์", "สถานะ", "วันที่เริ่มต้น", "วันที่สิ้นสุด"],
      rows: filtered.map((exec) => [
        exec.staff?.fullname || "-",
        exec.staff?.email || "-",
        exec.position,
        exec.phone || "-",
        exec.status === "active" ? "ดำรงตำแหน่ง" : "พ้นจากตำแหน่ง",
        exec.startDate,
        exec.endDate || "-",
      ]),
      orientation: "landscape",
    });
  };

  // ─── Modal ─────────────────────────────────────────────
  const openModal = (exec: Executive | null = null) => {
    setCurrentExec(exec);
    setPdfFile(null);
    if (exec) {
      setEditForm({
        position: exec.position,
        phone: exec.phone || "",
        status: exec.status,
        startDate: exec.startDate,
        endDate: exec.endDate || "",
      });
    } else {
      setCreateForm(EMPTY_CREATE_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentExec(null);
  };

  // ─── Save ─────────────────────────────────────────────
  const handleSave = async () => {
    // ── CREATE ──
    if (!currentExec) {
      if (!createForm.fullname || !createForm.email || !createForm.password || !createForm.position || !createForm.startDate) {
        toast.warning("กรุณากรอกข้อมูลให้ครบ (ชื่อ, อีเมล, รหัสผ่าน, ตำแหน่ง, วันที่เริ่มต้น)");
        return;
      }
      setSaving(true);
      try {
        await api.post("/staff", {
          fullname: createForm.fullname,
          email: createForm.email,
          password: createForm.password,
          role: "superadmin",
        });

        const { data: staffList } = await api.get<Array<{ id: number; email: string }>>("/staff");
        const newStaff = staffList.find((s) => s.email === createForm.email);

        if (newStaff) {
          const { data: execData } = await api.post("/executives", {
            staffId: newStaff.id,
            position: createForm.position,
            phone: createForm.phone || "",
            status: createForm.status,
            startDate: createForm.startDate,
            endDate: createForm.endDate || null,
          });

          if (pdfFile && execData?.executive?.id) {
            const formData = new FormData();
            formData.append("pdf", pdfFile);
            await axios.post(
              `http://localhost:5008/api/executives/${execData.executive.id}/pdf`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
          }
        }

        await fetchExecutives();
        closeModal();
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setSaving(false);
      }
      return;
    }

    // ── EDIT ──
    if (!editForm.position || !editForm.startDate) {
      toast.warning("กรุณากรอกตำแหน่งและวันที่เริ่มต้น");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/executives/${currentExec.id}`, {
        position: editForm.position,
        phone: editForm.phone,
        status: editForm.status,
        startDate: editForm.startDate,
        endDate: editForm.endDate || null,
      });

      if (pdfFile) {
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        await axios.post(
          `http://localhost:5008/api/executives/${currentExec.id}/pdf`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      await fetchExecutives();
      closeModal();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmModal.id) return;
    try {
      await api.delete(`/executives/${confirmModal.id}`);
      await fetchExecutives();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="rounded-lg dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 font-kanit relative w-full break-words">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <h5 className="text-xl font-bold">จัดการผู้บริหาร</h5>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExportPdf} color="success" size="sm">
            <Icon icon="solar:file-download-bold" height={16} className="mr-1" />
            Export PDF
          </Button>
          <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
            <Icon icon="solar:user-plus-bold" height={16} className="mr-1" />
            เพิ่มผู้บริหาร
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <TextInput
            icon={() => <Icon icon="solar:magnifer-linear" height={18} className="text-gray-400" />}
            placeholder="ค้นหาจากชื่อหรือตำแหน่ง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="min-w-[220px]">
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          >
            {uniquePositions.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        แสดง <span className="font-semibold text-gray-700 dark:text-gray-200">{filtered.length}</span>{" "}
        รายการ จากทั้งหมด{" "}
        <span className="font-semibold text-gray-700 dark:text-gray-200">{executives.length}</span> รายการ
      </p>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell className="p-4">รูป</Table.HeadCell>
            <Table.HeadCell>ชื่อ</Table.HeadCell>
            <Table.HeadCell>ตำแหน่ง</Table.HeadCell>
            <Table.HeadCell>เบอร์โทรศัพท์</Table.HeadCell>
            <Table.HeadCell>สถานะ</Table.HeadCell>
            <Table.HeadCell>เอกสาร PDF</Table.HeadCell>
            <Table.HeadCell>จัดการ</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-10">
                  <Spinner size="lg" />
                  <p className="mt-2 text-gray-400 text-sm">กำลังโหลด...</p>
                </Table.Cell>
              </Table.Row>
            ) : filtered.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-10 text-gray-400">
                  <Icon icon="solar:users-group-two-rounded-linear" height={40} className="mx-auto mb-2 opacity-30" />
                  <p>ไม่พบข้อมูลผู้บริหาร</p>
                </Table.Cell>
              </Table.Row>
            ) : (
              filtered.map((exec) => (
                <Table.Row key={exec.id}>
                  {/* ── ใช้ UploadAvatar เหมือน StaffPage โดยส่ง staffId ของ staff คนนั้น ── */}
                  <Table.Cell className="p-4">
                    <UploadAvatar
                      staffId={String(exec.staffId)}
                      currentAvatar={exec.staff?.avatarUrl}
                      onUploaded={fetchExecutives}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <p className="font-medium text-gray-900 dark:text-white">{exec.staff?.fullname}</p>
                    <p className="text-xs text-gray-400">{exec.staff?.email}</p>
                  </Table.Cell>
                  <Table.Cell className="text-sm text-gray-600 dark:text-gray-300">{exec.position}</Table.Cell>
                  <Table.Cell className="text-sm">{exec.phone || "-"}</Table.Cell>
                  <Table.Cell>
                    {exec.status === "active" ? (
                      <Badge color="success" className="w-fit">ดำรงตำแหน่ง</Badge>
                    ) : (
                      <Badge color="gray" className="w-fit">พ้นจากตำแหน่ง</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {exec.pdfPath ? (
                      <a
                        href={`http://localhost:5008${exec.pdfPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
                      >
                        <Icon icon="solar:file-text-bold" height={16} />
                        ดูเอกสาร
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">ไม่มีเอกสาร</span>
                    )}
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
                      <Dropdown.Item className="flex gap-3" onClick={() => openModal(exec)}>
                        <Icon icon="solar:pen-new-square-broken" height={18} />
                        <span>แก้ไข</span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        className="flex gap-3 text-red-500"
                        onClick={() => setConfirmModal({ isOpen: true, id: exec.id })}
                      >
                        <Icon icon="solar:trash-bin-minimalistic-outline" height={18} />
                        <span>ลบ</span>
                      </Dropdown.Item>
                    </Dropdown>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* ── Delete Confirm Modal ── */}
      <Modal className="font-kanit" show={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, id: null })}>
        <Modal.Header>ยืนยันการลบ</Modal.Header>
        <Modal.Body>คุณต้องการลบข้อมูลผู้บริหารนี้จริงหรือไม่? (ข้อมูลพนักงานจะไม่ถูกลบ)</Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={handleDeleteConfirmed}>ลบ</Button>
          <Button color="gray" onClick={() => setConfirmModal({ isOpen: false, id: null })}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Add / Edit Modal ── */}
      <Modal className="font-kanit" show={isModalOpen} onClose={closeModal} size="lg">
        <Modal.Header>{currentExec ? "แก้ไขข้อมูลผู้บริหาร" : "เพิ่มผู้บริหารใหม่"}</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col gap-4">

            {/* ══ CREATE FORM ══ */}
            {!currentExec && (
              <>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Icon icon="solar:user-id-bold" height={16} />
                    ข้อมูลบัญชีผู้ใช้
                  </p>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                      </label>
                      <TextInput
                        value={createForm.fullname}
                        onChange={(e) => setCreateForm({ ...createForm, fullname: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        อีเมล <span className="text-red-500">*</span>
                      </label>
                      <TextInput
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        รหัสผ่าน <span className="text-red-500">*</span>
                      </label>
                      <TextInput
                        type="password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Icon icon="solar:star-bold" height={16} />
                    ข้อมูลตำแหน่ง
                  </p>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        ตำแหน่ง <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={createForm.position}
                        onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                        className="w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="">-- เลือกตำแหน่ง --</option>
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">เบอร์โทรศัพท์</label>
                      <TextInput
                        placeholder="เบอร์โทรศัพท์"
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">สถานะ</label>
                      <select
                        value={createForm.status}
                        onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as "active" | "inactive" })}
                        className="w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="active">ดำรงตำแหน่ง</option>
                        <option value="inactive">พ้นจากตำแหน่ง</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">ระยะเวลาดำรงตำแหน่ง</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        วันที่เริ่มต้น <span className="text-red-500">*</span>
                      </label>
                      <TextInput
                        type="date"
                        value={createForm.startDate}
                        onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">วันที่สิ้นสุด</label>
                      <TextInput
                        type="date"
                        value={createForm.endDate}
                        min={createForm.startDate}
                        onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Icon icon="solar:file-text-bold" height={16} />
                    อัปโหลดเอกสาร PDF
                  </p>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Icon icon="solar:upload-bold" height={24} className="text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pdfFile ? pdfFile.name : "คลิกเพื่อเลือกไฟล์ PDF"}
                      </p>
                      {!pdfFile && <p className="text-xs text-gray-400">PDF ขนาดไม่เกิน 10MB</p>}
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {pdfFile && (
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Icon icon="solar:trash-bin-minimalistic-outline" height={14} />
                      ลบไฟล์ที่เลือก
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ══ EDIT FORM ══ */}
            {currentExec && (
              <>
                {/* Avatar + ชื่อ — คลิกเพื่อเปลี่ยนรูปได้ตรงนี้เลย */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                  <UploadAvatar
                    staffId={String(currentExec.staffId)}
                    currentAvatar={currentExec.staff?.avatarUrl}
                    onUploaded={fetchExecutives}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{currentExec.staff?.fullname}</p>
                    <p className="text-xs text-gray-400">{currentExec.staff?.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">คลิกที่รูปเพื่อเปลี่ยน</p>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
                    ตำแหน่ง <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="">-- เลือกตำแหน่ง --</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                <TextInput
                  placeholder="เบอร์โทรศัพท์"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">สถานะ</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })}
                    className="w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="active">ดำรงตำแหน่ง</option>
                    <option value="inactive">พ้นจากตำแหน่ง</option>
                  </select>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">ระยะเวลาดำรงตำแหน่ง</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        วันที่เริ่มต้น <span className="text-red-500">*</span>
                      </label>
                      <TextInput
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">วันที่สิ้นสุด</label>
                      <TextInput
                        type="date"
                        value={editForm.endDate}
                        min={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Icon icon="solar:file-text-bold" height={16} />
                    เอกสาร PDF
                  </p>
                  {currentExec?.pdfPath && !pdfFile && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <Icon icon="solar:file-text-bold" height={16} className="text-green-600" />
                      <a
                        href={`http://localhost:5008${currentExec.pdfPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 dark:text-green-400 hover:underline flex-1 truncate"
                      >
                        {currentExec.pdfPath.split("/").pop()}
                      </a>
                      <span className="text-xs text-gray-400">ไฟล์ปัจจุบัน</span>
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Icon icon="solar:upload-bold" height={24} className="text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pdfFile ? pdfFile.name : currentExec?.pdfPath ? "คลิกเพื่อเปลี่ยนไฟล์ PDF" : "คลิกเพื่อเลือกไฟล์ PDF"}
                      </p>
                      {!pdfFile && <p className="text-xs text-gray-400">PDF ขนาดไม่เกิน 10MB</p>}
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {pdfFile && (
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Icon icon="solar:trash-bin-minimalistic-outline" height={14} />
                      ลบไฟล์ที่เลือก
                    </button>
                  )}
                </div>
              </>
            )}

          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Spinner size="sm" className="mr-2" /> : null}
            {currentExec ? "บันทึกการแก้ไข" : "เพิ่มผู้บริหาร"}
          </Button>
          <Button color="failure" onClick={closeModal} disabled={saving}>ยกเลิก</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExecutivePage;
