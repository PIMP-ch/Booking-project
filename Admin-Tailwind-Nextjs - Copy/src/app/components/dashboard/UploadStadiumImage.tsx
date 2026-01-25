"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

interface UploadStadiumImageProps {
  stadiumId: string;
  currentImage?: string | string[];
  onUploaded?: (images: string[]) => void;
}

function normalizeUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

const UploadStadiumImage: React.FC<UploadStadiumImageProps> = ({
  stadiumId,
  currentImage,
  onUploaded,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [externalUrl, setExternalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- set preview จากข้อมูลเดิม ---------------- */
  useEffect(() => {
    if (Array.isArray(currentImage)) {
      setPreviews(currentImage.map(normalizeUrl));
    } else if (currentImage) {
      setPreviews([normalizeUrl(currentImage)]);
    } else {
      setPreviews([]);
    }
  }, [currentImage]);

  /* ---------------- upload ไฟล์ ---------------- */
  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/api/stadiums/${stadiumId}/images`,
        formData
      );

      const images = res.data?.images || [];
      setPreviews(images.map(normalizeUrl));
      onUploaded?.(images);
    } catch (err) {
      console.error("อัปโหลดรูปไม่สำเร็จ", err);
      alert("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- เพิ่มรูปจาก URL ---------------- */
  const addExternalUrl = async () => {
    if (!externalUrl.trim()) return;

    const formData = new FormData();
    formData.append("externalUrls", externalUrl.trim());

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/api/stadiums/${stadiumId}/images`,
        formData
      );

      const images = res.data?.images || [];
      setPreviews(images.map(normalizeUrl));
      onUploaded?.(images);
      setExternalUrl("");
    } catch (err) {
      console.error("เพิ่มรูปจาก URL ไม่สำเร็จ", err);
      alert("เพิ่มรูปจาก URL ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- ลบรูป ---------------- */
  const removeImage = async (index: number) => {
    if (!confirm("ต้องการลบรูปนี้ใช่หรือไม่")) return;

    try {
      setLoading(true);
      const res = await axios.delete(
        `${API_BASE}/api/stadiums/${stadiumId}/images/${index}`
      );

      const images = res.data?.images || [];
      setPreviews(images.map(normalizeUrl));
      onUploaded?.(images);
    } catch (err) {
      console.error("ลบรูปไม่สำเร็จ", err);
      alert("ลบรูปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* -------- Upload File -------- */}
      <div>
        <label className="block font-medium mb-1">อัปโหลดรูปจากเครื่อง</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) {
              uploadFiles(files);
              e.target.value = ""; // reset input
            }
          }}
        />
      </div>

      {/* -------- External URL -------- */}
      <div>
        <label className="block font-medium mb-1">เพิ่มรูปจาก URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="button"
            onClick={addExternalUrl}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            เพิ่ม
          </button>
        </div>
      </div>

      {/* -------- Preview -------- */}
      <div className="grid grid-cols-3 gap-3">
        {previews.map((src, idx) => (
          <div key={idx} className="relative">
            <img
              src={src}
              alt="stadium"
              className="w-full h-32 object-cover rounded"
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
            >
              ลบ
            </button>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">กำลังดำเนินการ...</p>}
    </div>
  );
};

export default UploadStadiumImage;
