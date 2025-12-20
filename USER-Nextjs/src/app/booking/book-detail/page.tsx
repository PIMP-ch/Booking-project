"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createBooking, API_BASE } from "@/utils/api";
import { Package, MapPin, CheckCircle, User, Clock, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";

// ✅ กำหนด Type ให้ชัดเจน
interface UserType {
    _id: string;
    fullname: string;
    email: string;
    fieldOfStudy: string;
    year: string;
}

interface Equipment {
    equipmentId: string;
    name: string;
    quantity: number;
    imageUrl?: string;
}

const DEFAULT_STADIUM_IMAGE = "/images/stadium-placeholder.jpg";
const DEFAULT_EQUIPMENT_IMAGE = "/images/products/s1.jpg";

const resolveStadiumImage = (imageUrl: string) => {
    if (!imageUrl || imageUrl.trim() === "") return DEFAULT_STADIUM_IMAGE;
    const trimmed = imageUrl.trim();
    if (trimmed.startsWith("/images/")) return trimmed;
    if (trimmed.startsWith("http")) return trimmed;
    if (trimmed.startsWith("data:")) return trimmed;
    return `${API_BASE}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
};

const resolveEquipmentImage = (imageUrl?: string) => {
    if (!imageUrl || imageUrl.trim() === "") return DEFAULT_EQUIPMENT_IMAGE;
    const trimmed = imageUrl.trim();
    if (trimmed.startsWith("/images/")) return trimmed;
    if (trimmed.startsWith("http")) return trimmed;
    if (trimmed.startsWith("data:")) return trimmed;
    return `${API_BASE}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
};

const EquipmentPreview = ({ imageUrl, name }: { imageUrl?: string; name: string }) => {
    const [src, setSrc] = useState(resolveEquipmentImage(imageUrl));

    useEffect(() => {
        setSrc(resolveEquipmentImage(imageUrl));
    }, [imageUrl]);

    return (
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <Image
                src={src}
                alt={name}
                fill
                className="object-cover"
                sizes="56px"
                onError={() => setSrc(DEFAULT_EQUIPMENT_IMAGE)}
            />
        </div>
    );
};

const BookingDetailPage = () => {
    return (
        <Suspense fallback={<p className="text-center text-gray-500">Loading...</p>}>
            <BookingDetail />
        </Suspense>
    );
};

const BookingDetail = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const stadiumName = searchParams?.get("stadiumName") ?? "ไม่พบชื่อสนาม";
    const stadiumId = searchParams?.get("stadiumId") ?? "";
    const startDate = searchParams?.get("startDate") ?? "";
    const endDate = searchParams?.get("endDate") ?? "";
    const equipmentQuery = searchParams?.get("equipment");
    const startTime = searchParams?.get("startTime") ?? "";
    const endTime = searchParams?.get("endTime") ?? "";
    const stadiumImage = searchParams?.get("stadiumImage") ?? "";

    // ✅ กำหนด Type ให้ `selectedEquipment`
    const selectedEquipment = useMemo<Equipment[]>(() => {
        if (!equipmentQuery) return [];
        try {
            const parsed = JSON.parse(equipmentQuery);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter((item: any) => item && item.equipmentId && item.name && item.quantity)
                .map((item: any) => ({
                    equipmentId: String(item.equipmentId),
                    name: String(item.name),
                    quantity: Number(item.quantity) || 0,
                    imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
                }))
                .filter((item: Equipment) => item.quantity > 0);
        } catch (error) {
            console.error("❌ Failed to parse equipment list:", error);
            return [];
        }
    }, [equipmentQuery]);
    const totalEquipmentQuantity = useMemo(
        () => selectedEquipment.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
        [selectedEquipment]
    );

    // ✅ กำหนด type `User | null` ให้ชัดเจน
    const [user, setUser] = useState<UserType | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [stadiumImgSrc, setStadiumImgSrc] = useState<string>(resolveStadiumImage(stadiumImage));

    useEffect(() => {
        setStadiumImgSrc(resolveStadiumImage(stadiumImage));
    }, [stadiumImage]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setLoadingUser(true);
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    const parsedUser: UserType = JSON.parse(storedUser);
                    setUser(parsedUser);
                } catch (error) {
                    console.error("❌ Error parsing user JSON:", error);
                    localStorage.removeItem("user");
                }
            }
            setLoadingUser(false);
        }

    }, []);

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/home");
        }
    };

    const handleBooking = async () => {
        if (!user) {
            alert("⛔ กรุณาเข้าสู่ระบบก่อนทำการจอง");
            return;
        }

        try {
            const bookingData = {
                userId: user._id,
                stadiumId,
                startDate,
                endDate,
                startTime, // ✅ เพิ่มเวลาเริ่มต้น
                endTime,   // ✅ เพิ่มเวลาสิ้นสุด
                equipment: selectedEquipment.map(({ equipmentId, quantity }) => ({
                    equipmentId,
                    quantity,
                })),
            };

            // console.log("📦 Booking Payload:", bookingData);

            const response = await createBooking(bookingData);
            // console.log("📩 API Response:", response);

            if (response?.success) {
                toast.success("✅ จองสำเร็จ");
                router.push("/booking/history");
            } else {
                alert(response.message || "❌ เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.error("❌ Booking Error:", error);
            alert("❌ จองไม่สำเร็จ กรุณาลองใหม่");
        }
    };

    return (
        <div className="relative min-h-screen font-kanit">
            <div className="absolute inset-0">
                <Image
                    src={stadiumImgSrc}
                    alt={stadiumName}
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                    onError={() => setStadiumImgSrc(DEFAULT_STADIUM_IMAGE)}
                />
                <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
            </div>

            <div className="relative z-10 px-4 pt-20 pb-32 max-w-[720px] mx-auto">
                <div className="backdrop-blur-sm bg-white/85 rounded-2xl shadow-xl p-5">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-orange-500 font-semibold mb-4"
                    >
                        <ArrowLeft size={20} />
                        ย้อนกลับ
                    </button>
                    <h1 className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2">
                        <CheckCircle size={24} className="text-orange-500" /> ยืนยันการจอง
                    </h1>

                    <div className="space-y-5">
                        <section className="bg-white/95 p-4 rounded-xl shadow border border-orange-200">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="text-orange-500" size={20} />
                                <h2 className="text-lg font-bold">สนามที่จอง & รายละเอียด</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="grid gap-3 grid-cols-3">
                                    <div className="col-span-1 relative w-full h-48 sm:h-50 rounded-2xl overflow-hidden bg-gray-100">
                                        <Image
                                            src={stadiumImgSrc}
                                            alt={stadiumName}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 100vw, 360px"
                                            onError={() => setStadiumImgSrc(DEFAULT_STADIUM_IMAGE)}
                                        />
                                    </div>

                                    <div className="col-span-2 rounded-lg border border-orange-100 bg-orange-50/70 p-4 space-y-3">
                                        <p className="text-sm text-orange-600 uppercase tracking-wide">สนามที่เลือก</p>
                                        <p className="text-2xl font-semibold text-gray-900 pr-4">{stadiumName}</p>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div>
                                                <p className="text-xs text-orange-600 uppercase tracking-wide">วันที่เริ่ม</p>
                                                <p className="text-base font-semibold text-gray-900">{dayjs(startDate).format("DD/MM/YYYY")}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-orange-600 uppercase tracking-wide">วันที่สิ้นสุด</p>
                                                <p className="text-base font-semibold text-gray-900">{dayjs(endDate).format("DD/MM/YYYY")}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-orange-600 uppercase tracking-wide">ช่วงเวลา</p>
                                                <p className="text-base font-semibold text-gray-900">{startTime} - {endTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        </section>

                        <section className="bg-white/95 p-4 rounded-xl shadow border border-orange-200">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Package className="text-orange-500" size={20} />
                                    <h2 className="text-lg font-bold">รายการอุปกรณ์</h2>
                                </div>
                                {totalEquipmentQuantity > 0 && (
                                    <span className="text-sm font-semibold text-orange-600">
                                        ทั้งหมด {totalEquipmentQuantity} ชิ้น
                                    </span>
                                )}
                            </div>
                            {selectedEquipment.length > 0 ? (
                                <div className="flex gap-3 overflow-x-auto pb-2 pr-1">
                                    {selectedEquipment.map((item) => (
                                        <div
                                            key={item.equipmentId}
                                            className="flex min-w-[220px] flex-shrink-0 items-center gap-3 rounded-xl border border-orange-100 bg-white/80 p-3"
                                        >
                                            <EquipmentPreview imageUrl={item.imageUrl} name={item.name} />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                                <p className="text-xs text-gray-600">
                                                    จำนวนที่จอง{" "}
                                                    <span className="font-semibold text-orange-500">x{item.quantity}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">ไม่ได้เลือกอุปกรณ์</p>
                            )}
                        </section>

                        <section className="bg-white/95 p-4 rounded-xl shadow border border-orange-200">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="text-orange-500" size={20} />
                                <h2 className="text-lg font-bold">ข้อมูลผู้จอง</h2>
                            </div>
                            {loadingUser ? (
                                <p className="text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</p>
                            ) : user ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-orange-600 uppercase tracking-wide">ชื่อผู้จอง</p>
                                        <p className="text-base font-semibold text-gray-900">{user.fullname}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-orange-600 uppercase tracking-wide">อีเมล</p>
                                        <p className="text-base text-gray-800">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-orange-600 uppercase tracking-wide">สาขาวิชา</p>
                                        <p className="text-base text-gray-800">{user.fieldOfStudy}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-orange-600 uppercase tracking-wide">ปีการศึกษา</p>
                                        <p className="text-base text-gray-800">{user.year}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-20">
                <div className="max-w-[720px] mx-auto px-4 pb-4">
                    <div className="backdrop-blur-sm bg-white/85 shadow-2xl p-4 rounded-2xl flex items-center justify-center">
                        <button
                            onClick={handleBooking}
                            className="w-full max-w-xs px-6 py-3 rounded-xl text-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 transition"
                        >
                            จองเลย
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailPage;
