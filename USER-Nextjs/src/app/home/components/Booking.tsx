"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllStadiums, API_BASE } from "@/utils/api";
import { toast } from "react-toastify";
import { Volleyball } from "lucide-react";
import { ImageCarousel } from "./ImageCarousel";
import Image from "next/image";

// ✅ Component แสดงรูปพร้อม fallback กรณีรูปโหลดไม่ได้
export function SafeImage({ src, alt }: { src: string; alt: string }) {
  const [img, setImg] = useState(src);

  // อัปเดต src เมื่อ props เปลี่ยน
  useEffect(() => {
    setImg(src && src.trim() !== "" ? src : "/images/stadium-placeholder.jpg");
  }, [src]);

  return (
    <Image
      src={img}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 50vw"
      onError={() => setImg("/images/stadium-placeholder.jpg")} // เมื่อ Error ให้ใช้รูปสำรอง
      unoptimized // เพิ่มไว้หากยังไม่ได้ตั้งค่า remotePatterns ใน next.config.js
    />
  );
}

const Booking = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("stadiums");
  const [stadiums, setStadiums] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ โหลดข้อมูลสนาม
  useEffect(() => {
    const fetchStadiums = async () => {
      try {
        const data = await getAllStadiums();
        setStadiums(data);
      } catch (error) {
        toast.error("โหลดข้อมูลสนามไม่สำเร็จ");
      }
    };
    fetchStadiums();

    // ✅ ดึง userId จาก localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
      } catch (error) {
        console.error("❌ Error parsing user JSON:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    console.log(stadiums)
  }, [stadiums])

  const handleComingSoon = () => toast.info("🚀 ฟังก์ชันนี้กำลังอัปเดต");

  const handleSelectStadium = (
    stadiumId: string,
    stadiumName: string,
    stadiumImage: string,
    sportTypeId: string
  ) => {
    if (!userId) {
      toast.error("⛔ กรุณาเข้าสู่ระบบก่อนจองสนาม");
      return;
    }

    router.push(
      `/booking/selectDate?stadiumId=${stadiumId}&stadiumName=${encodeURIComponent(
        stadiumName
      )}&stadiumImage=${encodeURIComponent(stadiumImage)}&userId=${userId}&sportTypeId=${sportTypeId}`
    );
  };

  const menuItems = [
    {
      id: "stadiums",
      label: "จองสนาม",
      icon: <Volleyball size={24} className="text-orange-500" />,
    },
  ];

  return (
    <div className="p-1 pt-20 font-kanit mb-20 max-w-[670px] mx-auto">
      {/* เมนูตัวเลือก */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              item.id === "stadiums" ? setActiveTab("stadiums") : handleComingSoon()
            }
            className={`flex flex-col items-center justify-center p-3 rounded-sm shadow-md transition-all
              ${activeTab === item.id ? "border-2 border-orange-500 bg-white" : "bg-white"}
            `}
          >
            {item.icon}
            <span className="text-sm font-semibold text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>

      {/* แสดงข้อมูลสนาม */}
      {activeTab === "stadiums" && (
        <div>
          <h1 className="text-base mb-4 text-start text-gray-800">รายการสนามทั้งหมด</h1>
          <div className="grid grid-cols-2 gap-4">
            {stadiums.map((stadium) => {
              // Build array of full image URLs (handle both array and string cases)
              let imagesArr: string[] = [];

              if (Array.isArray(stadium.imageUrl) && stadium.imageUrl.length > 0) {
                imagesArr = stadium.imageUrl.map((p: string) =>
                  p && p.trim() !== "" ? (p.startsWith("http") ? p : `${API_BASE}${p}`) : "/images/stadium-placeholder.jpg"
                );
              } else if (typeof stadium.imageUrl === "string") {
                const p = stadium.imageUrl;
                imagesArr = [p && p.trim() !== "" ? (p.startsWith("http") ? p : `${API_BASE}${p}`) : "/images/stadium-placeholder.jpg"];
              } else {
                imagesArr = ["/images/stadium-placeholder.jpg"];
              }

              // Use first image as thumbnail/source for selection link
              const imgSrc = imagesArr[0] || "/images/stadium-placeholder.jpg";

              return (
                <div key={stadium.id} className="border rounded-sm shadow-md bg-white overflow-hidden">
                  {/* ส่วนแสดงรูปภาพ */}
                  <div className="relative w-full h-32 bg-gray-100">
                    {Array.isArray(stadium.imageUrl) && stadium.imageUrl.length > 1 ? (
                      <ImageCarousel images={imagesArr} alt={stadium.nameStadium} />
                    ) : (
                      <SafeImage src={imgSrc} alt={stadium.nameStadium} />
                    )}
                  </div>

                  {/* ข้อมูลสนาม */}
                  <div className="p-3">
                    <h2 className="text-base font-bold mb-1 truncate">{stadium.nameStadium}</h2>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2 min-h-[2rem]">
                      {stadium.descriptionStadium}
                    </p>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                      <span>📞 {stadium.contactStadium || "ไม่ระบุ"}</span>
                    </div>

                    <button
                      className="w-full bg-orange-500 text-white py-2 rounded-md text-sm font-semibold hover:bg-orange-600 transition active:scale-95"
                      onClick={() =>
                        handleSelectStadium(stadium.id, stadium.nameStadium, imgSrc, stadium.sportTypeId)
                      }
                    >
                      จองสนามนี้
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {stadiums.length === 0 && (
            <div className="text-center py-10 text-gray-500">ไม่พบข้อมูลสนามในขณะนี้</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Booking;