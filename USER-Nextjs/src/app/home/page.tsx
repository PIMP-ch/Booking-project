"use client";

import Navbar from "./components/Navbar";
import BottomMenu from "./components/BottomMenu";
import ProfilePage from "../profile/page";
import HistoryContent from "../history/HistoryContent";
import Booking from "./components/Booking";
import { useEffect, useState } from "react";

type Stadium = {
  _id: string;
  nameStadium: string;
  descriptionStadium: string;
  contactStadium: string;
  statusStadium: "active" | "inactive" | "IsBooking";
  imageUrl?: string; // <- สำคัญ
};

const HomePage = () => {
  const [activePage, setActivePage] = useState<"home" | "history" | "profile">(
    "home"
  );
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/stadiums`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setStadiums(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Fetch stadiums failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100 font-kanit">
      {/* Navbar */}
      <Navbar />

      {/* เนื้อหาส่วนกลาง */}
      <div className="flex-grow p-2">
        {activePage === "home" && (
          <Booking stadiums={stadiums} loading={loading} />
        )}
        {activePage === "history" && <HistoryContent />}
        {activePage === "profile" && <ProfilePage />}
      </div>

      {/* Bottom Navigation */}
      <BottomMenu activePage={activePage} onChange={(page) => setActivePage(page)} />
    </div>
  );
};

export default HomePage;
