"use client";
import React, { useState, useEffect } from "react";
import { Navbar, Drawer } from "flowbite-react";
import { Icon } from "@iconify/react";
import MobileSidebar from "../sidebar/MobileSidebar";

const Header = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Mobile Sidebar
  const [staffName, setStaffName] = useState<string>("");

  // Simulating fetching the staff name (replace with your actual logic)
  useEffect(() => {
    // Example: Fetch staff name from localStorage, API, or state
    const name = localStorage.getItem("staffName") || "ชื่อผู้ใช้งาน"; // Default if not found
    setStaffName(name);
  }, []);

  const handleScroll = () => {
    if (window.scrollY > 50) {
      setIsSticky(true);
    } else {
      setIsSticky(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle Logout
  const handleLogout = () => {
    // Clear relevant auth tokens or user data
    localStorage.removeItem("staffName"); // Example: Remove staff name
    // Redirect to login page (if applicable)
    window.location.href = "/auth/login";
  };

  return (
    <>
      <header
        className={`sticky top-0 z-[5] ${isSticky
          ? "bg-lightgray dark:bg-dark shadow-md fixed w-full"
          : "bg-transparent"
          }`}
      >
        <Navbar
          fluid
          className={` font-kanit rounded-none bg-transparent dark:bg-transparent py-4 sm:px-30 px-4`}
        >
          <div className="flex gap-3 items-center justify-between w-full">
            {/* Mobile Toggle Icon */}
            <div className="flex gap-2 items-center">
              <span
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 flex text-black dark:text-white text-opacity-65 xl:hidden hover:text-primary hover:bg-lightprimary rounded-full justify-center items-center cursor-pointer"
              >
                <Icon icon="solar:hamburger-menu-line-duotone" height={21} />
              </span>
            </div>

            {/* Staff Greeting and Logout */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 ">
              <Icon icon="solar:user-hand-up-bold" height={20} color="gray" />
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

      {/* Mobile Sidebar */}
      <Drawer open={isOpen} onClose={() => setIsOpen(false)} className="w-130">
        <Drawer.Items>
          <MobileSidebar />
        </Drawer.Items>
      </Drawer>
    </>
  );
};

export default Header;
