"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { adjustEquipmentTransactions } from "@/utils/api";
import * as XLSX from "xlsx";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

interface Equipment {
    id: string;
    name: string;
    quantity: number;
    imageUrl?: string;
}

interface Transaction {
    id: number;
    equipmentId: string;
    type: "in" | "out";
    quantity: number;
    note: string | null;
    createdAt: string;
}

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipment: Equipment | null;
}

async function fetchTransactionsByEquipment(equipmentId: string): Promise<Transaction[]> {
    const data = await adjustEquipmentTransactions(equipmentId);
    return data.data?.transactions ?? data.transactions ?? [];
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
    isOpen,
    onClose,
    equipment,
}) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [filterMonth, setFilterMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });
    const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");

    useEffect(() => {
        if (isOpen && equipment) {
            loadTransactions();
        }
    }, [isOpen, equipment]);

    const loadTransactions = async () => {
        if (!equipment) return;
        try {
            setIsLoading(true);
            const data = await fetchTransactionsByEquipment(equipment.id);
            setTransactions(data);
        } catch {
            toast.error("โหลดประวัติไม่สำเร็จ");
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = transactions.filter((tx) => {
        const date = new Date(tx.createdAt);
        const txMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const matchMonth = filterMonth ? txMonth === filterMonth : true;
        const matchType = filterType === "all" ? true : tx.type === filterType;
        return matchMonth && matchType;
    });

    const totalIn = filtered.filter((t) => t.type === "in").reduce((s, t) => s + t.quantity, 0);
    const totalOut = filtered.filter((t) => t.type === "out").reduce((s, t) => s + t.quantity, 0);

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleExportExcel = () => {
        if (!equipment || filtered.length === 0) {
            toast.warning("ไม่มีข้อมูลสำหรับ export");
            return;
        }

        const rows: Record<string, string | number>[] = filtered.map((tx) => ({
            "ประเภท": tx.type === "in" ? "รับเข้า" : "จำหน่ายออก",
            "จำนวน (ชิ้น)": tx.quantity,
            "หมายเหตุ": tx.note ?? "-",
            "วันที่": formatDate(tx.createdAt),
        }));

        // Blank + summary rows
        rows.push(
            { "ประเภท": "", "จำนวน (ชิ้น)": "", "หมายเหตุ": "", "วันที่": "" },
            { "ประเภท": "รวมรับเข้า", "จำนวน (ชิ้น)": totalIn, "หมายเหตุ": "", "วันที่": "" },
            { "ประเภท": "รวมจำหน่ายออก", "จำนวน (ชิ้น)": totalOut, "หมายเหตุ": "", "วันที่": "" },
        );

        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 22 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ประวัติ");

        const filename = `ประวัติ_${equipment.name}_${filterMonth || "ทั้งหมด"}.xlsx`;
        XLSX.writeFile(wb, filename);
        toast.success("Export สำเร็จ!");
    };

    return (
        <Modal show={isOpen} onClose={onClose} size="lg" className="font-kanit">
            <Modal.Header className="border-b border-gray-100 pt-6 px-8 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:history-bold" className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-800 leading-tight">
                            ประวัติรับเข้า / จำหน่ายออก
                        </p>
                        {equipment && (
                            <p className="text-xs text-gray-400 font-normal">
                                {equipment.name} · คงเหลือปัจจุบัน{" "}
                                <span className="font-semibold text-gray-600">
                                    {equipment.quantity} ชิ้น
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="px-8 py-5 space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                        <Icon icon="solar:calendar-bold" className="text-gray-400 flex-shrink-0" />
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="flex-1 rounded-xl border border-gray-200 text-sm h-10 px-3 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                        {(["all", "in", "out"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                    filterType === t
                                        ? t === "in"
                                            ? "bg-white text-emerald-600 shadow-sm"
                                            : t === "out"
                                            ? "bg-white text-red-500 shadow-sm"
                                            : "bg-white text-gray-700 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {t === "all" ? "ทั้งหมด" : t === "in" ? "รับเข้า" : "จำหน่ายออก"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Icon icon="solar:download-bold" className="text-emerald-600 text-sm" />
                        </div>
                        <div>
                            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">รับเข้า</p>
                            <p className="text-lg font-bold text-emerald-700 leading-tight">{totalIn} <span className="text-xs font-normal">ชิ้น</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <Icon icon="solar:upload-bold" className="text-red-500 text-sm" />
                        </div>
                        <div>
                            <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">จำหน่ายออก</p>
                            <p className="text-lg font-bold text-red-600 leading-tight">{totalOut} <span className="text-xs font-normal">ชิ้น</span></p>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-72 rounded-xl border border-gray-100 divide-y divide-gray-50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                            <Icon icon="svg-spinners:ring-resize" className="text-3xl text-indigo-400" />
                            <p className="text-sm">กำลังโหลด...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                            <Icon icon="solar:inbox-bold" className="text-4xl text-gray-200" />
                            <p className="text-sm">ไม่พบประวัติในช่วงเวลานี้</p>
                        </div>
                    ) : (
                        filtered.map((tx) => (
                            <div key={tx.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "in" ? "bg-emerald-50" : "bg-red-50"}`}>
                                    <Icon
                                        icon={tx.type === "in" ? "solar:download-bold" : "solar:upload-bold"}
                                        className={`text-base ${tx.type === "in" ? "text-emerald-500" : "text-red-400"}`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {tx.type === "in" ? "รับเข้า" : "จำหน่ายออก"}{" "}
                                        <span className={`font-bold ${tx.type === "in" ? "text-emerald-600" : "text-red-500"}`}>
                                            {tx.quantity} ชิ้น
                                        </span>
                                    </p>
                                    {tx.note && <p className="text-xs text-gray-400 truncate">{tx.note}</p>}
                                </div>
                                <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(tx.createdAt)}</p>
                            </div>
                        ))
                    )}
                </div>
            </Modal.Body>

            <Modal.Footer className="border-t border-gray-100 px-8 pb-6 pt-4 flex gap-3">
                <Button
                    onClick={handleExportExcel}
                    disabled={filtered.length === 0}
                    className="flex-1 rounded-2xl h-11 bg-emerald-500 hover:bg-emerald-600 border-none text-white disabled:opacity-50"
                >
                    <Icon icon="solar:file-download-bold" className="mr-2 text-lg" />
                    Export Excel
                </Button>
                <Button
                    color="gray"
                    onClick={onClose}
                    className="flex-1 rounded-2xl h-11 border-none bg-gray-100 hover:bg-gray-200"
                >
                    ปิด
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TransactionHistoryModal;