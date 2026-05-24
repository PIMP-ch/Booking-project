"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllStadiums, API_BASE } from "@/utils/api";
import { toast } from "react-toastify";
import { Volleyball, BookOpen } from "lucide-react";
import { ImageCarousel } from "./ImageCarousel";
import Image from "next/image";
import ClassSchedule from "./ClassSchedule";

export function SafeImage({ src, alt }: { src: string; alt: string }) {
  const [img, setImg] = useState(src);

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
      onError={() => setImg("/images/stadium-placeholder.jpg")}
      unoptimized
    />
  );
}

const Booking = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("stadiums");
  const [stadiums, setStadiums] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("");

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

    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
        setUserType(parsedUser.userType ?? "");
      } catch (error) {
        console.error("❌ Error parsing user JSON:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const isStaff = userType === "staff";

  const handleSelectStadium = (
    stadiumId: string,
    stadiumName: string,
    stadiumImage: string,
    stadiumImages: string[],
    sportTypeId: string
  ) => {
    router.push(
      `/booking/selectDate?stadiumId=${stadiumId}&stadiumName=${encodeURIComponent(
        stadiumName
      )}&stadiumImage=${encodeURIComponent(stadiumImage)}&stadiumImages=${encodeURIComponent(
        JSON.stringify(stadiumImages)
      )}&userId=${userId}&sportTypeId=${sportTypeId}`
    );
  };

  const menuItems = [
    {
      id: "stadiums",
      label: "จองสนาม",
      icon: <Volleyball size={24} className="text-orange-500" />,
      show: true,
    },
    {
      id: "schedule",
      label: "ตารางเรียน",
      icon: <BookOpen size={24} className="text-blue-500" />,
      show: isStaff,
    },
  ];

  return (
    // ── wrapper หลัก: ไม่จำกัดความกว้าง ให้ทุก tab ใช้พื้นที่เต็มจอ
    <div className="p-1 pt-20 font-kanit mb-20">

      {/* เมนูตัวเลือก — จำกัดแค่ส่วน menu ให้อยู่กลาง */}
      <div className="max-w-[670px] mx-auto mb-4">
        <div className="grid grid-cols-3 gap-3">
          {menuItems
            .filter((item) => item.show)
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-sm shadow-md transition-all
                  ${activeTab === item.id ? "border-2 border-orange-500 bg-white" : "bg-white"}
                `}
              >
                {item.icon}
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              </button>
            ))}
        </div>
      </div>

      {/* ===== แสดงสนาม — ใช้ max-w เดิมเพราะเป็น card grid มือถือ ===== */}
      {activeTab === "stadiums" && (
        <div className="max-w-[670px] mx-auto">
          <h1 className="text-base mb-4 text-start text-gray-800">รายการสนามทั้งหมด</h1>
          <div className="grid grid-cols-2 gap-4">
            {stadiums.map((stadium) => {
              let imagesArr: string[] = [];

              if (Array.isArray(stadium.imageUrl) && stadium.imageUrl.length > 0) {
                imagesArr = stadium.imageUrl.map((p: string) =>
                  p && p.trim() !== ""
                    ? p.startsWith("http") ? p : `${API_BASE}${p}`
                    : "/images/stadium-placeholder.jpg"
                );
              } else if (typeof stadium.imageUrl === "string") {
                const p = stadium.imageUrl;
                imagesArr = [
                  p && p.trim() !== ""
                    ? p.startsWith("http") ? p : `${API_BASE}${p}`
                    : "/images/stadium-placeholder.jpg",
                ];
              } else {
                imagesArr = ["/images/stadium-placeholder.jpg"];
              }

              const imgSrc = imagesArr[0] || "/images/stadium-placeholder.jpg";

              return (
                <div key={stadium.id} className="border rounded-sm shadow-md bg-white overflow-hidden">
                  <div className="relative w-full h-32 bg-gray-100">
                    {Array.isArray(stadium.imageUrl) && stadium.imageUrl.length > 1 ? (
                      <ImageCarousel images={imagesArr} alt={stadium.nameStadium} />
                    ) : (
                      <SafeImage src={imgSrc} alt={stadium.nameStadium} />
                    )}
                  </div>
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
                        handleSelectStadium(stadium.id, stadium.nameStadium, imgSrc, imagesArr, stadium.sportType)
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

      {/* ===== ตารางเรียน — เต็มความกว้าง ไม่มี max-w ===== */}
      {activeTab === "schedule" && isStaff && (
        <div className="w-full px-4">
          <ClassSchedule />
        </div>
      )}
    </div>
  );
};

export default Booking;
