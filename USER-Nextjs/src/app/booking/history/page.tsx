"use client";

import { useRouter } from "next/navigation";
import HistoryContent from "../../history/HistoryContent";
import Navbar from "@/app/home/components/Navbar";
import BottomMenu from "@/app/home/components/BottomMenu";

const BookingHistoryPage = () => {
  const router = useRouter();

  const handleNavigate = (page: "home" | "history" | "profile") => {
    if (page === "home") {
      router.push("/home");
      return;
    }
    if (page === "profile") {
      router.push("/profile");
      return;
    }
    router.push("/booking/history");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100 font-kanit">
      <Navbar />
      <div className="flex-grow p-2">
        <HistoryContent />
      </div>
      <BottomMenu activePage="history" onChange={handleNavigate} />
    </div>
  );
};

export default BookingHistoryPage;
