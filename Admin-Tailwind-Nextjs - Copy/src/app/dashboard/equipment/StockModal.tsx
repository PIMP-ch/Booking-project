"use client";

import React, { useState } from "react";
import { Modal, Button } from "flowbite-react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { adjustEquipment } from "@/utils/api";

interface Equipment {
    id: string;
    name: string;
    quantity: number;
    status: string;
    imageUrl?: string;
    sportTypeId?: number;
}

interface StockModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipmentList: Equipment[];
    onSuccess: () => void;
}

type OutReason = "normal_out" | "damaged" | "lost";

const OUT_REASONS: { value: OutReason; label: string; icon: string; color: string }[] = [
    { value: "normal_out", label: "ปกติ",      icon: "solar:upload-bold",        color: "text-red-500 border-red-300 bg-red-50" },
    { value: "damaged",    label: "ชำรุดเสียหาย", icon: "solar:danger-triangle-bold", color: "text-orange-500 border-orange-300 bg-orange-50" },
    { value: "lost",       label: "สูญหาย",     icon: "solar:question-circle-bold", color: "text-gray-500 border-gray-300 bg-gray-50" },
];

const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose, equipmentList, onSuccess }) => {
    const [form, setForm] = useState<{
        equipmentId: string;
        type: "in" | "out";
        quantity: number;
        note: string;
        outReason: OutReason;
    }>({
        equipmentId: "",
        type: "in",
        quantity: 1,
        note: "",
        outReason: "normal_out",
    });
    const [isSaving, setIsSaving] = useState(false);

    const selectedEquipment = equipmentList.find((e) => e.id === form.equipmentId);

    const handleClose = () => {
        setForm({ equipmentId: "", type: "in", quantity: 1, note: "", outReason: "normal_out" });
        onClose();
    };

    const handleConfirm = async () => {
        if (!form.equipmentId) { toast.error("กรุณาเลือกอุปกรณ์"); return; }
        if (!form.quantity || form.quantity < 1) { toast.error("กรุณาระบุจำนวนที่ถูกต้อง"); return; }
        if (form.type === "out" && selectedEquipment && form.quantity > selectedEquipment.quantity) {
            toast.error("จำนวนจำหน่ายออกเกินจำนวนที่มีอยู่");
            return;
        }

        try {
            setIsSaving(true);
            const reason = form.type === "in" ? "normal_in" : form.outReason;
            await adjustEquipment({
                equipmentId: form.equipmentId,
                type: form.type,
                quantity: form.quantity,
                note: form.note || undefined,
                reason,
            });

            const reasonLabel = OUT_REASONS.find((r) => r.value === form.outReason)?.label;
            toast.success(
                form.type === "in"
                    ? "รับเข้าอุปกรณ์สำเร็จ"
                    : `จำหน่ายออกอุปกรณ์สำเร็จ${form.outReason !== "normal_out" ? ` (${reasonLabel})` : ""}`
            );
            onSuccess();
            handleClose();
        } catch {
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={handleClose} size="md" className="font-kanit">
            <Modal.Header className="border-b border-gray-100 pb-4 pt-6 px-8">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Icon icon="solar:box-bold" className="text-blue-600 text-xl" />
                    </div>
                    <span className="text-lg font-bold text-gray-800">รับเข้า / จำหน่ายออก</span>
                </div>
            </Modal.Header>

            <Modal.Body className="px-8 py-6 space-y-5">
                {/* Equipment Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">อุปกรณ์</label>
                    <select
                        value={form.equipmentId}
                        onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 text-sm h-11 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">— เลือกอุปกรณ์ —</option>
                        {equipmentList.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                                {eq.name} (คงเหลือ: {eq.quantity})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Type Toggle */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ประเภทการดำเนินการ</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setForm({ ...form, type: "in" })}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${form.type === "in" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <Icon icon="solar:download-bold" className={`text-base ${form.type === "in" ? "text-emerald-500" : "text-gray-400"}`} />
                            รับเข้า
                        </button>
                        <button
                            onClick={() => setForm({ ...form, type: "out" })}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${form.type === "out" ? "bg-white text-red-500 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <Icon icon="solar:upload-bold" className={`text-base ${form.type === "out" ? "text-red-400" : "text-gray-400"}`} />
                            จำหน่ายออก
                        </button>
                    </div>
                </div>

                {/* เหตุผลการจำหน่ายออก — แสดงเมื่อ type = "out" */}
                {form.type === "out" && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            เหตุผล <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {OUT_REASONS.map((r) => (
                                <button
                                    key={r.value}
                                    onClick={() => setForm({ ...form, outReason: r.value })}
                                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                                        form.outReason === r.value
                                            ? `${r.color} border-current shadow-sm`
                                            : "border-gray-200 text-gray-400 hover:border-gray-300"
                                    }`}
                                >
                                    <Icon icon={r.icon} className="text-lg" />
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        {form.outReason === "damaged" && (
                            <p className="text-xs text-orange-500 bg-orange-50 rounded-lg px-3 py-2">
                                จะถูกบันทึกในรายงานอุปกรณ์ชำรุด/เสียหาย
                            </p>
                        )}
                        {form.outReason === "lost" && (
                            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                จะถูกบันทึกในรายงานอุปกรณ์สูญหาย
                            </p>
                        )}
                    </div>
                )}

                {/* Quantity */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">จำนวน</label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg transition-colors flex-shrink-0"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            min={1}
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
                            className="flex-1 h-10 rounded-xl border border-gray-200 text-center text-base font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => setForm((f) => ({ ...f, quantity: f.quantity + 1 }))}
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg transition-colors flex-shrink-0"
                        >
                            +
                        </button>
                    </div>
                    {selectedEquipment && (
                        <p className="text-xs text-gray-400 text-right">
                            คงเหลือปัจจุบัน:{" "}
                            <span className="font-semibold text-gray-600">{selectedEquipment.quantity} ชิ้น</span>
                            {form.type === "out" && form.quantity > selectedEquipment.quantity && (
                                <span className="ml-2 text-red-500 font-semibold">⚠ เกินจำนวนที่มี</span>
                            )}
                        </p>
                    )}
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        หมายเหตุ <span className="font-normal text-gray-400">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="ระบุรายละเอียดเพิ่มเติม..."
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 text-sm px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Summary */}
                {selectedEquipment && form.quantity > 0 && (
                    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                        form.type === "in" ? "bg-emerald-50 text-emerald-700"
                        : form.outReason === "damaged" ? "bg-orange-50 text-orange-700"
                        : form.outReason === "lost" ? "bg-gray-100 text-gray-700"
                        : "bg-red-50 text-red-600"
                    }`}>
                        <Icon
                            icon={
                                form.type === "in" ? "solar:download-bold"
                                : form.outReason === "damaged" ? "solar:danger-triangle-bold"
                                : form.outReason === "lost" ? "solar:question-circle-bold"
                                : "solar:upload-bold"
                            }
                            className="text-lg flex-shrink-0"
                        />
                        <span>
                            {form.type === "in" ? "รับเข้า"
                                : form.outReason === "damaged" ? "จำหน่ายออก (ชำรุดเสียหาย)"
                                : form.outReason === "lost" ? "จำหน่ายออก (สูญหาย)"
                                : "จำหน่ายออก"}{" "}
                            <strong>{form.quantity}</strong> ชิ้น · {selectedEquipment.name}
                        </span>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="border-t border-gray-100 flex gap-3 px-8 pb-8 pt-4">
                <Button
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className={`flex-1 rounded-2xl h-11 border-0 ${
                        form.type === "in" ? "bg-emerald-500 hover:bg-emerald-600"
                        : form.outReason === "damaged" ? "bg-orange-500 hover:bg-orange-600"
                        : form.outReason === "lost" ? "bg-gray-500 hover:bg-gray-600"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                >
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                            <Icon icon="svg-spinners:ring-resize" className="text-base" /> กำลังบันทึก...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Icon icon="solar:check-circle-bold" className="text-base" /> ยืนยัน
                        </span>
                    )}
                </Button>
                <Button color="gray" onClick={handleClose} className="flex-1 rounded-2xl h-11 border-none bg-gray-100 hover:bg-gray-200">
                    ยกเลิก
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default StockModal;
