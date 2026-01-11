"use client";
import React, { useEffect, useState } from "react";

type Props = {
  stadiumId: string;
  currentImage?: string; // fallback รูปหลักเดิม เช่น "/uploads/stadiums/xxx.jpg"
  onChanged?: () => void; // callback หลังอัปโหลด
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

  // fallback: ถ้ายังส่งมาแค่ currentImage (รูปหลัก) ก็แสดงรูปเดียวไปก่อน
  useEffect(() => {
    setPreviews(currentImage ? [`${API_BASE}${currentImage}`] : []);
  }, [currentImage]);

  async function upload(files: FileList) {
    try {
      setLoading(true);
      setErr("");

      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f)); // ✅ key ต้องเป็น "images"

      // ✅ ใช้ endpoint หลายรูป
      const res = await fetch(`${API_BASE}/api/stadiums/${stadiumId}/images`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");

      const { stadium } = await res.json();

      // ✅ ถ้า backend คืน imageUrls มา ให้เอามาแสดงทั้งหมด
      if (Array.isArray(stadium?.imageUrls) && stadium.imageUrls.length > 0) {
        setPreviews(stadium.imageUrls.map((u: string) => `${API_BASE}${u}`));
      } else if (stadium?.imageUrl) {
        // fallback เผื่อมีแค่ imageUrl
        setPreviews([`${API_BASE}${stadium.imageUrl}`]);
      } else {
        setPreviews([]);
      }

      onChanged?.();
    } catch (e: any) {
      setErr(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function removeOne(index: number) {
    try {
      setLoading(true);
      setErr("");

      const res = await fetch(
        `${API_BASE}/api/stadiums/${stadiumId}/images/${index}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("ลบรูปไม่สำเร็จ");

      const { stadium } = await res.json();

      // อัปเดต preview จากข้อมูลใหม่
      if (Array.isArray(stadium?.imageUrls)) {
        setPreviews(stadium.imageUrls.map((u: string) => `${API_BASE}${u}`));
      } else if (stadium?.imageUrl) {
        setPreviews([`${API_BASE}${stadium.imageUrl}`]);
      } else {
        setPreviews([]);
      }

      onChanged?.();
    } catch (e: any) {
      setErr(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="flex items-start gap-3">
      {/* ✅ preview หลายรูป */}
      <div className="grid grid-cols-4 gap-2">
        {previews.length > 0 ? (
          previews.map((src, idx) => (
            <div
              key={idx}
              className="w-16 h-16 rounded-md overflow-hidden border bg-gray-100"
            >
              <img
                src={src}
                className="w-full h-full object-cover"
                alt={`stadium-${idx}`}
              />
            </div>
          ))
        ) : (
          <div className="w-16 h-16 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            ไม่มีรูป
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {/* ✅ เลือกได้หลายรูป */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) upload(e.target.files);
          }}
          disabled={loading}
          className="text-xs"
        />

        {previews.length > 0 ? (
          previews.map((src, idx) => (
            <div
              key={idx}
              className="relative w-16 h-16 rounded-md overflow-hidden border bg-gray-100"
            >
              <img src={src} className="w-full h-full object-cover" alt={`stadium-${idx}`} />

              {/* ปุ่มลบทีละรูป */}
              <button
                type="button"
                onClick={() => removeOne(idx)}
                disabled={loading}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                title="ลบรูปนี้"
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <div className="w-16 h-16 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            ไม่มีรูป
          </div>
        )}

        {loading && <p className="text-blue-500 text-xs">กำลังอัปเดต...</p>}
        {err && <p className="text-red-500 text-xs">{err}</p>}
      </div>
    </div>
  );
}
