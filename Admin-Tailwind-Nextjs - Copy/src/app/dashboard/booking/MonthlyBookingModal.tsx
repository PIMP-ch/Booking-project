"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
import { Icon } from "@iconify/react";
import { getAllStadiums, getBuildings, lockBooking } from "@/utils/api";

// ─── Types ─────────────────────────────────────────────
interface Stadium {
    id: number;
    nameStadium: string;
    buildingIds: number[];
}

interface Building {
    id: number;
    name: string;
}

interface MonthlyBookingModalProps {
    onSubmit?: (data: MonthlyBookingData) => void;
}

export interface MonthlyBookingData {
    stadiumId: number;
    buildingId: number | null;
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
    dayOfWeek: number;
}

// ─── Constants ─────────────────────────────────────────
const DAYS_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const MONTHS_TH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

// ─── Component ─────────────────────────────────────────
const MonthlyBookingModal: React.FC<MonthlyBookingModalProps> = ({ onSubmit }) => {
    const [isOpen, setIsOpen] = useState(false);
    const now = new Date();

    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [stadiumId, setStadiumId] = useState<number | null>(null);
    const [buildingId, setBuildingId] = useState<number | null>(null);

    const [startMonth, setStartMonth] = useState(now.getMonth());
    const [startYear, setStartYear] = useState(now.getFullYear());
    const [endMonth, setEndMonth] = useState(now.getMonth());
    const [endYear, setEndYear] = useState(now.getFullYear());

    const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Fetch API ──
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [stadiumRes, buildingRes] = await Promise.all([
                    getAllStadiums(),
                    getBuildings(),
                ]);

                setStadiums(stadiumRes);
                setBuildings(buildingRes);

            } catch (err) {
                console.error("โหลดข้อมูลล้มเหลว", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const selectedStadium = stadiums.find((s) => s.id === stadiumId);

    // 👉 filter อาคารตามสนาม
    const availableBuildings = selectedStadium
        ? buildings.filter((b) => selectedStadium.buildingIds.includes(b.id))
        : [];

    // ── Validation ──
    const validate = () => {
        const e: Record<string, string> = {};

        if (!stadiumId) e.stadium = "กรุณาเลือกสนาม";

        if (selectedStadium?.buildingIds.length && !buildingId) {
            e.building = "กรุณาเลือกอาคาร";
        }

        if (dayOfWeek === null) e.day = "กรุณาเลือกวัน";

        const startVal = startYear * 12 + startMonth;
        const endVal = endYear * 12 + endMonth;

        if (endVal < startVal) {
            e.range = "เดือนสิ้นสุดต้องไม่ก่อนเดือนเริ่มต้น";
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };


    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            setSubmitting(true);

            const payload = {
                userId: 1, // 🔥 ต้องมี (สำคัญ)
                stadiumId: stadiumId!,
                buildingId,
                startMonth,
                startYear,
                endMonth,
                endYear,
                dayOfWeek: dayOfWeek!,
            };

            const res = await lockBooking(payload);

            alert(`จองสำเร็จ ${res.totalCreated} รายการ`);

            setIsOpen(false);

        } catch (err: any) {
            console.error(err);
            alert(err?.response?.data?.message || "เกิดข้อผิดพลาด");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setErrors({});
    };

    return (
        <>
            {/* Trigger */}
            {/* <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl"
            >
                <Icon icon="solar:calendar-add-bold" />
                จองรายเดือน
            </button> */}

            <Modal show={isOpen} onClose={handleClose} size="lg">
                <Modal.Header>จองสนามรายเดือน</Modal.Header>

                <Modal.Body className="space-y-6">

                    {/* Stadium */}
                    <Section label="สนามกีฬา" required>
                        <select
                            value={stadiumId ?? ""}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                setStadiumId(id);
                                setBuildingId(null);
                            }}
                            className="field"
                        >
                            <option value="">-- เลือกสนาม --</option>
                            {stadiums.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nameStadium}
                                </option>
                            ))}
                        </select>

                        {loading && <p className="text-xs text-gray-400">กำลังโหลด...</p>}
                        <FieldError msg={errors.stadium} />
                    </Section>

                    {/* Buildings */}
                    {availableBuildings.length > 0 && (
                        <Section label="อาคาร" required>
                            <select
                                value={buildingId ?? ""}
                                onChange={(e) => setBuildingId(Number(e.target.value))}
                                className="field"
                            >
                                <option value="">-- เลือกอาคาร --</option>
                                {availableBuildings.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                            <FieldError msg={errors.building} />
                        </Section>
                    )}

                    {/* Month */}
                    <Section label="ช่วงเดือน" required>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={startMonth} onChange={(e) => setStartMonth(+e.target.value)} className="field">
                                {MONTHS_TH.map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                ))}
                            </select>

                            <select value={endMonth} onChange={(e) => setEndMonth(+e.target.value)} className="field">
                                {MONTHS_TH.map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <FieldError msg={errors.range} />
                    </Section>

                    {/* Day */}
                    <Section label="วัน" required>
                        <div className="grid grid-cols-7 gap-2">
                            {DAYS_TH.map((d, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setDayOfWeek(i)}
                                    className={`p-2 border rounded ${dayOfWeek === i
                                        ? "bg-blue-500 text-white"
                                        : "bg-white"
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <FieldError msg={errors.day} />
                    </Section>

                </Modal.Body>

                <Modal.Footer>

                    <Button color="gray" onClick={handleClose}>
                        ยกเลิก
                    </Button>
                    <Button color="gray" onClick={handleSubmit}>
                        ยืนยัน
                    </Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                .field {
                    width: 100%;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 6px;
                }
            `}</style>
        </>
    );
};

// ─── Helpers ─────────────────────────────────────────
const Section = ({ label, children, required }: any) => (
    <div>
        <p className="text-sm font-medium mb-1">
            {label} {required && "*"}
        </p>
        {children}
    </div>
);

const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-red-500">{msg}</p> : null;

export default MonthlyBookingModal;