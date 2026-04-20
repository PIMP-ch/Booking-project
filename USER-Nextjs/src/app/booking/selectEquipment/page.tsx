"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllEquipment, API_BASE } from "@/utils/api";
import { toast } from "react-toastify";
import { PlusCircle, MinusCircle, Package, ArrowLeft, XCircle } from "lucide-react";
import Image from "next/image";

type EquipmentItem = {
  id: string;
  name: string;
  quantity: number; // จำนวนคงเหลือในสต็อก
  imageUrl?: string;
};

type SelectedItem = {
  equipmentId: string;
  name: string;
  quantity: number; // จำนวนที่ผู้ใช้เลือก
  imageUrl?: string;
};

const DEFAULT_EQUIPMENT_IMAGE = "/images/products/s1.jpg";

const resolveImageSrc = (imageUrl?: string) => {
  if (!imageUrl || imageUrl.trim() === "") return DEFAULT_EQUIPMENT_IMAGE;
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith("http")) return trimmed;
  return `${API_BASE}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
};

const EquipmentImage = ({ imageUrl, name }: { imageUrl?: string; name: string }) => {
  const [src, setSrc] = useState(resolveImageSrc(imageUrl));

  useEffect(() => {
    setSrc(resolveImageSrc(imageUrl));
  }, [imageUrl]);

  return (
    <div className="relative w-full h-24 mb-3 overflow-hidden rounded-sm bg-gray-100">
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 200px"
        onError={() => setSrc(DEFAULT_EQUIPMENT_IMAGE)}
      />
    </div>
  );
};

const Thumb = ({ imageUrl, name }: { imageUrl?: string; name: string }) => {
  const [src, setSrc] = useState(resolveImageSrc(imageUrl));
  useEffect(() => setSrc(resolveImageSrc(imageUrl)), [imageUrl]);
  return (
    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white">
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover"
        sizes="40px"
        onError={() => setSrc(DEFAULT_EQUIPMENT_IMAGE)}
      />
    </div>
  );
};

const SelectEquipmentPage = () => {
  return (
    <Suspense fallback={<p className="text-center text-gray-500 py-10 font-kanit">กำลังโหลด...</p>}>
      <SelectEquipment />
    </Suspense>
  );
};

const SelectEquipment = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ ดึง Parameter รวมถึง building + activityName เพิ่มเติม
  const stadiumId = searchParams?.get("stadiumId") ?? "";
  const stadiumName = searchParams?.get("stadiumName") ?? "ไม่พบชื่อสนาม";
  const building = searchParams?.get("building") ?? "";
  const buildingName = searchParams?.get("buildingName") ?? "";
  const activityNameParam = searchParams?.get("activityName") ?? ""; // ✅ เพิ่มชื่อกิจกรรม
  const userId = searchParams?.get("userId") ?? "";
  const startDate = searchParams?.get("startDate") ?? "";
  const endDate = searchParams?.get("endDate") ?? "";
  const startTime = searchParams?.get("startTime") ?? "";
  const endTime = searchParams?.get("endTime") ?? "";
  const stadiumImage = searchParams?.get("stadiumImage") ?? "";
  const equipmentParam = searchParams?.get("equipment");

  // ✅ state สำหรับชื่อกิจกรรม (ให้ผู้ใช้กรอก/แก้ไขได้)
  const [activityName, setActivityName] = useState(activityNameParam);

  useEffect(() => {
    // เผื่อเข้าหน้านี้แบบมี query มาทีหลัง/รีเฟรช
    setActivityName(activityNameParam);
  }, [activityNameParam]);

  const initialSelectedEquipment = useMemo<SelectedItem[]>(() => {
    if (!equipmentParam) return [];
    try {
      const parsed = JSON.parse(equipmentParam);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && item.equipmentId && item.quantity)
        .map((item) => ({
          equipmentId: String(item.equipmentId),
          name: String(item.name || ""),
          quantity: Number(item.quantity) || 0,
          imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
        }));
    } catch (error) {
      console.error("❌ Failed to parse equipment param", error);
      return [];
    }
  }, [equipmentParam]);

  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedItem[]>(initialSelectedEquipment);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialSelectedEquipment.length > 0) {
      setSelectedEquipment(initialSelectedEquipment);
    }
  }, [initialSelectedEquipment]);

  const sportTypeId = searchParams?.get("sportTypeId");

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const data = await getAllEquipment();
        console.log(data)
        const filtered = sportTypeId
          ? data.filter((item) => item.sportTypeId == sportTypeId)
          : data;
        setEquipmentList(Array.isArray(filtered) ? filtered : []);
      } catch (error) {
        toast.error("โหลดข้อมูลอุปกรณ์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  const handleIncrease = (equipmentId: string, name: string, maxQuantity: number, imageUrl?: string) => {
    setSelectedEquipment((prev) => {
      const existing = prev.find((item) => item.equipmentId === equipmentId);
      if (existing) {
        const newQuantity = existing.quantity + 1;
        if (newQuantity > maxQuantity) return prev;
        return prev.map((item) =>
          item.equipmentId === equipmentId
            ? { ...item, quantity: newQuantity, imageUrl: item.imageUrl ?? imageUrl }
            : item
        );
      }
      return [...prev, { equipmentId, name, quantity: 1, imageUrl }];
    });
  };

  const handleDecrease = (equipmentId: string) => {
    setSelectedEquipment((prev) => {
      const existing = prev.find((item) => item.equipmentId === equipmentId);
      if (!existing) return prev;

      const newQuantity = existing.quantity - 1;
      if (newQuantity <= 0) return prev.filter((item) => item.equipmentId !== equipmentId);

      return prev.map((item) => (item.equipmentId === equipmentId ? { ...item, quantity: newQuantity } : item));
    });
  };

  const handleRemove = (equipmentId: string) => {
    setSelectedEquipment((prev) => prev.filter((i) => i.equipmentId !== equipmentId));
  };

  const handleBack = () => {
    const params = new URLSearchParams({
      stadiumId,
      stadiumName,
      building,
      activityName: activityName.trim(), // ✅ ส่งกลับด้วย
      userId,
      startDate,
      endDate,
      startTime,
      endTime,
      ...(stadiumImage ? { stadiumImage } : {}),
    });

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/booking/selectDate?${params.toString()}`);
    }
  };

  const handleNext = () => {
    // ✅ บังคับกรอกชื่อกิจกรรมก่อน
    if (!activityName.trim()) {
      toast.error("กรุณากรอกชื่อกิจกรรมก่อนกดถัดไป");
      return;
    }

    const equipmentQuery =
      selectedEquipment.length > 0 ? `&equipment=${encodeURIComponent(JSON.stringify(selectedEquipment))}` : "";

    const baseParams = new URLSearchParams({
      stadiumId,
      stadiumName,
      building,
      buildingName,
      activityName: activityName.trim(), // ✅ ส่งชื่อกิจกรรมไปหน้า book-detail
      userId,
      startDate,
      endDate,
      startTime,
      endTime,
      ...(stadiumImage ? { stadiumImage } : {}),
    });

    router.push(`/booking/book-detail?${baseParams.toString()}${equipmentQuery}`);
  };

  return (
    <div className="relative min-h-screen font-kanit">
      {/* 🔹 พื้นหลัง */}
      <div className="absolute inset-0">
        <Image
          src={stadiumImage || "/images/stadium-placeholder.jpg"}
          alt={stadiumName}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="relative z-10 p-5 max-w-[960px] mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-orange-400 font-semibold mb-4 hover:text-orange-300 transition"
        >
          <ArrowLeft size={20} />
          ย้อนกลับ
        </button>

        <h1 className="text-2xl font-bold text-center mb-2 flex items-center justify-center gap-2 text-white">
          <Package size={24} className="text-orange-300" /> เลือกอุปกรณ์
        </h1>

        <p className="text-center text-gray-200 mb-4">เลือกจำนวนอุปกรณ์ที่ต้องการใช้สำหรับ {stadiumName}</p>

        {/* 🧺 อุปกรณ์ที่เลือก (live) */}
        <div className="mb-5">
          <div className="bg-white/90 backdrop-blur border border-orange-200 rounded-xl p-4 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">
              อุปกรณ์ที่เลือก ({selectedEquipment.length} รายการ)
            </h2>

            {selectedEquipment.length === 0 ? (
              <p className="text-gray-500 italic py-2">ยังไม่ได้เลือกอุปกรณ์เสริม...</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {selectedEquipment.map((item) => (
                  <div
                    key={item.equipmentId}
                    className="flex items-center justify-between gap-3 p-2 border rounded-lg bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Thumb imageUrl={item.imageUrl} name={item.name} />
                      <div>
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</p>
                        <p className="text-xs text-orange-600 font-bold">จำนวน: {item.quantity}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrease(item.equipmentId)}
                        className="text-gray-500 hover:text-red-600 transition"
                        title="ลดจำนวน"
                      >
                        <MinusCircle size={22} />
                      </button>
                      <button
                        onClick={() => handleIncrease(item.equipmentId, item.name, Number.MAX_SAFE_INTEGER, item.imageUrl)}
                        className="text-gray-500 hover:text-orange-600 transition"
                        title="เพิ่มจำนวน"
                      >
                        <PlusCircle size={22} />
                      </button>
                      <button
                        onClick={() => handleRemove(item.equipmentId)}
                        className="ml-1 text-gray-400 hover:text-red-600 transition"
                        title="เอาออกจากรายการ"
                      >
                        <XCircle size={22} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 📋 รายการอุปกรณ์ทั้งหมด */}
        {loading ? (
          <div className="flex flex-col items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-3"></div>
            <p className="text-center text-gray-200">กำลังโหลดข้อมูลอุปกรณ์...</p>
          </div>
        ) : equipmentList.length === 0 ? (
          <p className="text-center text-gray-200 py-10">ไม่มีอุปกรณ์ให้เลือกในขณะนี้</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-32">
            {equipmentList.map((item) => {
              const selectedItem = selectedEquipment.find((eq) => eq.equipmentId === item.id);
              const selectedCount = selectedItem ? selectedItem.quantity : 0;
              const isMax = selectedCount >= item.quantity;
              const isMin = selectedCount <= 0;

              return (
                <div
                  key={item.id}
                  className="p-3 border rounded-lg shadow-md bg-white/95 backdrop-blur transition hover:shadow-lg"
                >
                  <EquipmentImage imageUrl={item.imageUrl} name={item.name} />
                  <h2 className="text-sm font-bold text-center min-h-[40px] flex items-center justify-center text-gray-800 px-1 leading-snug">
                    {item.name}
                  </h2>
                  <p className="text-[11px] text-gray-500 text-center mb-2">คงเหลือ {item.quantity} ชิ้น</p>
                  <div className="flex items-center justify-center gap-3 mt-1 bg-gray-50 py-2 rounded-md">
                    <button
                      onClick={() => handleDecrease(item.id)}
                      className={`transition ${isMin ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:text-red-600"}`}
                      disabled={isMin}
                    >
                      <MinusCircle size={24} />
                    </button>
                    <span className="text-lg font-bold text-orange-600 w-6 text-center">{selectedCount}</span>
                    <button
                      onClick={() => handleIncrease(item.id, item.name, item.quantity, item.imageUrl)}
                      className={`transition ${isMax ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:text-orange-600"}`}
                      disabled={isMax}
                    >
                      <PlusCircle size={24} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 🧾 แถบสรุปด้านล่าง */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.1)] p-4 z-20">
          <div className="max-w-[960px] mx-auto flex justify-between items-center px-2">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">รายการที่เลือก</p>
              <p className="text-orange-600 text-2xl font-extrabold">
                {selectedEquipment.length} <span className="text-sm font-medium text-gray-600">รายการ</span>
              </p>
            </div>
            <button
              onClick={handleNext}
              className="px-8 py-3.5 rounded-xl text-lg font-bold shadow-lg shadow-orange-200 transition bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
            >
              ต่อไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectEquipmentPage;
