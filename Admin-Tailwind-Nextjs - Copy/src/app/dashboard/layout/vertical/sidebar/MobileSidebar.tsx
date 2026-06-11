"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "flowbite-react";
import { getSidebarContent } from "./Sidebaritems";
import type { MenuItem } from "./Sidebaritems";
import NavItems from "./NavItems";
import NavCollapse from "./NavCollapse";
import Logo from "@/app/dashboard/layout/shared/logo/Logo";
import { Icon } from "@iconify/react";

type Props = { onClose?: () => void };

const fbTheme = {
  root: { base: "w-full", inner: "w-full bg-transparent p-0" },
};

const MobileSidebar: React.FC<Props> = ({ onClose }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    setMenu(getSidebarContent());
  }, []);

  return (
    <div
      className="font-kanit flex flex-col bg-white dark:bg-darkgray"
      style={{ width: "18rem", height: "100dvh" }}
    >
      {/* โลโก้ + ปุ่มปิด */}
      <div className="px-4 py-4 flex items-center justify-between shrink-0 border-b">
        <Logo />
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <Icon icon="solar:close-circle-bold" height={22} />
        </button>
      </div>

      {/* เมนู scroll ได้ */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Sidebar aria-label="Sidebar mobile" theme={fbTheme} className="w-full">
          <Sidebar.Items className="px-4 py-3">
            <div className="sidebar-nav">
              {menu.map((item, index) => (
                <React.Fragment key={index}>
                  <h5 className="text-link font-semibold text-sm caption px-2 mt-4 first:mt-2">
                    <span className="hide-menu">{item.heading}</span>
                  </h5>
                  <Sidebar.ItemGroup>
                    {item.children?.map((child, idx) => (
                      <React.Fragment key={child.id ?? idx}>
                        {child.children ? (
                          <NavCollapse item={child} onItemClick={onClose} />
                        ) : (
                          <NavItems item={child} onItemClick={onClose} />
                        )}
                      </React.Fragment>
                    ))}
                  </Sidebar.ItemGroup>
                </React.Fragment>
              ))}
            </div>
          </Sidebar.Items>
        </Sidebar>
      </div>
    </div>
  );
};

export default MobileSidebar;
