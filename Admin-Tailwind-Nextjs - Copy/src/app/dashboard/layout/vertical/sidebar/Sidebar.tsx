"use client";
import React, { useState, useEffect } from "react";
import { Sidebar as FBSidebar } from "flowbite-react";
import { getSidebarContent } from "./Sidebaritems";
import type { MenuItem } from "./Sidebaritems";
import NavItems from "./NavItems";
import NavCollapse from "./NavCollapse";
import SimpleBar from "simplebar-react";
import Logo from "@/app/dashboard/layout/shared/logo/Logo";

export default function Sidebar() {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    setMenu(getSidebarContent());
  }, []);

  return (
    <aside className="hidden xl:block border-r bg-white dark:bg-dark sticky top-0 h-[100dvh] w-72">
      <div className="h-full flex flex-col">
        {/* โลโก้ */}
        <div className="px-4 py-4 flex items-center justify-between">
          <Logo />
        </div>

        {/* รายการเมนู */}
        <SimpleBar className="flex-1">
          <FBSidebar aria-label="Main sidebar" className="menu-sidebar bg-transparent w-full">
            <FBSidebar.Items className="px-3">
              <div className="sidebar-nav">
                {menu.map((group, gi) => (
                  <React.Fragment key={`g-${gi}`}>
                    {/* หัวข้อหมวด — อยู่นอก ul แล้ว */}
                    <h5 className="text-link font-semibold text-sm caption px-2 py-2">
                      <span className="hide-menu">{group.heading}</span>
                    </h5>

                    <FBSidebar.ItemGroup>
                      {group.children?.map((child, ci) => (
                        <React.Fragment key={child.id ?? `it-${ci}`}>
                          {child.children ? (
                            <NavCollapse item={child} />
                          ) : (
                            <NavItems item={child} />
                          )}
                        </React.Fragment>
                      ))}
                    </FBSidebar.ItemGroup>
                  </React.Fragment>
                ))}
              </div>
            </FBSidebar.Items>
          </FBSidebar>
        </SimpleBar>
      </div>
    </aside>
  );
}