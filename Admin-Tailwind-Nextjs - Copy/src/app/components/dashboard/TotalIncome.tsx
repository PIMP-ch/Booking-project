"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Dropdown } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { getPendingBookingsCount } from "@/utils/api"; // Import API function

const TotalPendingBookings = () => {
  const [pendingBookings, setPendingBookings] = useState<number | null>(null);

  // Fetch pending bookings count
  useEffect(() => {
    fetchPendingBookingsCount();
  }, []);

  const fetchPendingBookingsCount = async () => {
    try {
      const count = await getPendingBookingsCount();
      setPendingBookings(count);
    } catch (err) {
      console.error("Failed to fetch pending bookings:", err);
    }
  };

  return (
    <div className="bg-lightsecondary rounded-lg p-6 relative w-full break-words font-kanit">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-14 h-10 rounded-full flex items-center justify-center bg-secondary text-white">
            <Icon icon="solar:calendar-outline" height={24} />
          </span>
          <h5 className="text-base opacity-70">จำนวนการจองที่ยังไม่ได้ยืนยัน</h5>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-[24px] items-end mt-10">
        <div className="xl:col-span-12 col-span-12 text-center">
          {pendingBookings !== null ? (
            <h2 className="text-3xl mb-3">{pendingBookings.toLocaleString()}</h2>
          ) : (
            <h2 className="text-lg mb-3">กำลังโหลด...</h2>
          )}
          <span className="font-semibold border rounded-full border-black/5 dark:border-white/10 py-0.5 px-[10px] leading-[normal] text-xs text-dark dark:text-darklink">
            <span className="opacity-70">จำนวนการจองที่ยังไม่ถูกยืนยัน</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TotalPendingBookings;
