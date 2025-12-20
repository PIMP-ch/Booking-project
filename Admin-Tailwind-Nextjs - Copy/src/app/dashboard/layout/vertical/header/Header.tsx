"use client";
import React, { useState, useEffect } from "react";
import { Navbar, Drawer } from "flowbite-react";
import { Icon } from "@iconify/react";
import MobileSidebar from "../sidebar/MobileSidebar";
import { useSidebar } from "../sidebar/useSidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5008";

const Header = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Drawer (mobile)
  const [staffName, setStaffName] = useState<string>("ชื่อผู้ใช้งาน");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const { open, setOpen } = useSidebar();

  useEffect(() => {
    // ดึงข้อมูลจาก localStorage (ที่ควรเก็บหลัง login)
    const name = localStorage.getItem("staffName") || "ชื่อผู้ใช้งาน";
    const avatar = localStorage.getItem("staffAvatar") || "";

    setStaffName(name);
    setAvatarUrl(avatar);

    const onScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("staffName");
    localStorage.removeItem("staffAvatar");
    window.location.href = "/auth/login";
  };

  return (
    <>
      <header
        className={`sticky top-0 z-[5] ${
          isSticky ? "bg-lightgray dark:bg-dark shadow-md" : "bg-transparent"
        }`}
      >
        <Navbar
          fluid
          className="font-kanit rounded-none bg-transparent dark:bg-transparent py-4 sm:px-30 px-4"
        >
          <div className="flex gap-3 items-center justify-between w-full">
            {/* Left controls */}
            <div className="flex gap-2 items-center">
              {/* Mobile hamburger -> เปิด Drawer */}
              <button
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 xl:hidden inline-flex items-center justify-center rounded-full hover:bg-lightprimary"
                aria-label="Open sidebar (mobile)"
              >
                <Icon icon="solar:hamburger-menu-line-duotone" height={21} />
              </button>

              {/* Desktop hamburger -> toggle ย่อ/ขยาย Sidebar */}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="h-10 w-10 hidden xl:inline-flex items-center justify-center rounded-full hover:bg-lightprimary"
                aria-label="Toggle sidebar (desktop)"
                title={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                <Icon icon="solar:hamburger-menu-line-duotone" height={21} />
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-gray-100">
              {/* ✅ แสดงรูปโปรไฟล์ */}
              {avatarUrl ? (
                <img
                  src={`${API_BASE}${avatarUrl}`}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  ?
                </div>
              )}

              <span className="text-sm font-medium dark:text-white text-black">
                สวัสดี: {staffName}
              </span>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600"
              >
                <Icon icon="solar:login-3-bold" height={20} />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </Navbar>
      </header>

      {/* Drawer (mobile) */}
      <Drawer open={isOpen} onClose={() => setIsOpen(false)} className="w-130">
        <Drawer.Items>
          <MobileSidebar onClose={() => setIsOpen(false)} />
        </Drawer.Items>
      </Drawer>
    </>
  );
};

export default Header;
