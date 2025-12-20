"use client";
import React, { useState, useEffect } from "react";

type Props = {
  staffId: string;
  currentAvatar?: string;    // ตัวอย่าง: "/uploads/avatars/xxx.jpg"
  onUploaded?: () => void;   // callback หลังอัปโหลดเสร็จ
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

export default function UploadAvatar({ staffId, currentAvatar, onUploaded }: Props) {
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    setPreview(currentAvatar ? `${API_BASE}${currentAvatar}` : "");
  }, [currentAvatar]);

  async function handleUpload(file: File) {
    try {
      setLoading(true);
      setErr("");

      const fd = new FormData();
      fd.append("avatar", file);

      const res = await fetch(`${API_BASE}/api/staff/${staffId}/avatar`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");

      const { staff } = await res.json();
      setPreview(`${API_BASE}${staff.avatarUrl}`);
      onUploaded?.();
    } catch (e: any) {
      setErr(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try{
      setLoading(true);
      setErr("");

      const res = await fetch(`${API_BASE}/api/staff/${staffId}/avatar`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("ลบรูปไม่สำเร็จ");

      const { staff } = await res.json();
      setPreview("");
      localStorage.setItem("staffAvatar", "");//ล้าง localStorage
      onUploaded?.();
    } catch (e: any){
      setErr(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="w-12 h-12 rounded-full overflow-hidden border bg-gray-100">
        {preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
            ไม่มีรูป
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="text-xs"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
        }}
        disabled={loading}
      />

      {preview && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-red-500 text-xs hover:underline"
        >
          ลบรูป
        </button>
      )}

      {loading && <p className="text-blue-500 text-[11px]">กำลังอัปโหลด...</p>}
      {!!err && <p className="text-red-500 text-[11px]">{err}</p>}
    </div>
  );
}
