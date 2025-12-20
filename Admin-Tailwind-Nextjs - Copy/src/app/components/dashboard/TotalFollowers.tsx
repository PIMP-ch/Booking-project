"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Dropdown } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { getTotalUsers } from "@/utils/api";

const TotalFollowers = () => {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  // ดึงจำนวนผู้ใช้ทั้งหมดเมื่อ Component โหลด
  useEffect(() => {
    fetchTotalUsers();
  }, []);

  const fetchTotalUsers = async () => {
    try {
      const users = await getTotalUsers();
      setTotalUsers(users);
    } catch (err) {
      console.error("Failed to fetch total users:", err);
    }
  };

  return (
    <div className="font-kanit bg-lighterror rounded-lg p-6 relative w-full break-words">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-14 h-10 rounded-full flex items-center justify-center bg-error text-white">
            <Icon icon="solar:users-group-rounded-bold-duotone" height={24} />
          </span>
          <h5 className="text-base opacity-70">จำนวนผู้ใช้งานทั้งหมด</h5>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-[24px] items-end mt-3">
        <div className="xl:col-span-12 col-span-12 text-center">
          {totalUsers !== null ? (
            <h2 className="text-3xl mb-3">{totalUsers.toLocaleString()}</h2>
          ) : (
            <h2 className="text-lg mb-3">กำลังโหลด...</h2>
          )}

        </div>
      </div>
    </div>
  );
};

export default TotalFollowers;
