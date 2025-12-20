"use client";
import React from "react";
import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import NavCollapse from "./NavCollapse";
import SimpleBar from "simplebar-react";
import Logo from "@/app/dashboard/layout/shared/logo/Logo";
import { Icon } from "@iconify/react";

type Props = { onClose?: () => void };

const MobileSidebar: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="font-kanit w-72">
      <Sidebar
        className="menu-sidebar pt-6 bg-white dark:bg-darkgray w-72"
        aria-label="Sidebar mobile"
      >
        {/* Logo + ปุ่มปิด */}
        <div className="mb-4 px-4 flex items-center justify-between">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <Icon icon="solar:close-circle-bold" height={22} />
          </button>
        </div>

        <SimpleBar className="h-[calc(100vh_-_100px)]">
          <Sidebar.Items className="px-4">
            <Sidebar.ItemGroup className="sidebar-nav">
              {SidebarContent.map((item, index) => (
                <React.Fragment key={index}>
                  <h5 className="text-link font-semibold text-sm caption">
                    <span className="hide-menu">{item.heading}</span>
                  </h5>
                  <Icon
                    icon="solar:menu-dots-bold"
                    className="text-ld block mx-auto mt-6 leading-6 dark:text-opacity-60 hide-icon"
                    height={18}
                  />

                  {item.children?.map((child, idx) => (
                    <React.Fragment key={child.id ?? idx}>
                      {child.children ? (
                        <div onClick={onClose}>
                          <NavCollapse item={child} onItemClick={onClose}/>
                        </div>
                      ) : (
                        <div onClick={onClose}>
                          <NavItems item={child} onItemClick={onClose}/>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </Sidebar.ItemGroup>
          </Sidebar.Items>
        </SimpleBar>
      </Sidebar>
    </div>
  );
};

export default MobileSidebar;
