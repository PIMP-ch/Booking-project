"use client";
import React, { useEffect, useState } from "react";

type Props = {
  stadiumId: string;
  currentImage?: string | string[]; // ✅ รองรับทั้ง String (เดิม) และ Array (ใหม่)
  onChanged?: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

export default function UploadStadiumImage({
  stadiumId,
  currentImage,
  onChanged,
}: Props) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // ✅ ปรับ Effect ให้รองรับ Array จาก Model (imageUrl)
  useEffect(() => {
    if (Array.isArray(currentImage)) {
      setPreviews(currentImage.map((u) => `${API_BASE}${u}`));
    } else if (currentImage) {
      setPreviews([`${API_BASE}${currentImage}`]);
    } else {
      setPreviews([]);
    }
  }, [currentImage]);

  async function upload(files: FileList) {
    try {
      setLoading(true);
      setErr("");

      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));

      const res = await fetch(`${API_BASE}/api/stadiums/${stadiumId}/images`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");

      const { stadium } = await res.json();

      // ✅ เปลี่ยนจาก imageUrls เป็น imageUrl ตาม Model
      if (Array.isArray(stadium?.imageUrl)) {
        setPreviews(stadium.imageUrl.map((u: string) => `${API_BASE}${u}`));
      }

      onChanged?.();
    } catch (e: any) {
      setErr(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function removeOne(index: number) {
    if (!confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?")) return;
    try {
      setLoading(true);
      setErr("");

      const res = await fetch(
        `${API_BASE}/api/stadiums/${stadiumId}/images/${index}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("ลบรูปไม่สำเร็จ");

      const { stadium } = await res.json();

      // ✅ เปลี่ยนจาก imageUrls เป็น imageUrl ตาม Model
      if (Array.isArray(stadium?.imageUrl)) {
        setPreviews(stadium.imageUrl.map((u: string) => `${API_BASE}${u}`));
      }

      onChanged?.();
    } catch (e: any) {
      setErr(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-2 border rounded-md bg-white">
      {/* ส่วนแสดงรูปภาพ (Previews) */}
      <div className="flex flex-wrap gap-2">
        {previews.length > 0 ? (
          previews.map((src, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded-md overflow-hidden border bg-gray-100 shadow-sm"
            >
              <img
                src={src}
                className="w-full h-full object-cover"
                alt={`stadium-${idx}`}
              />
              {/* ปุ่มลบ (กากบาท) */}
              <button
                type="button"
                onClick={() => removeOne(idx)}
                disabled={loading}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center hover:bg-red-700 shadow-md"
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <div className="w-20 h-20 rounded-md border-2 border-dashed flex items-center justify-center text-[10px] text-gray-400">
            ไม่มีรูปภาพ
          </div>
        )}
      </div>

      {/* ปุ่มเลือกไฟล์ */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">เพิ่มรูปภาพสนาม:</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) upload(e.target.files);
          }}
          disabled={loading}
          className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
        />
        {loading && <p className="text-orange-500 text-[10px] animate-pulse">กำลังดำเนินการ...</p>}
        {err && <p className="text-red-500 text-[10px]">{err}</p>}
      </div>
    </div>
  );
}