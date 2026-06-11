"use client";
import React, { useState, useEffect } from "react";
import { Sidebar as FBSidebar } from "flowbite-react";
import { getSidebarContent } from "./Sidebaritems";
import type { MenuItem } from "./Sidebaritems";
import NavItems from "./NavItems";
import NavCollapse from "./NavCollapse";
import Logo from "@/app/dashboard/layout/shared/logo/Logo";
import { useSidebar } from "./useSidebar";

const fbTheme = {
  root: { base: "w-full", inner: "w-full bg-transparent p-0" },
};

export default function Sidebar() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const { open } = useSidebar();

  useEffect(() => {
    setMenu(getSidebarContent());
  }, []);

  return (
    <aside
      className="hidden xl:flex flex-col border-r bg-white dark:bg-dark"
      style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: "18rem", zIndex: 40,
        transform: open ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.2s ease",
      }}
    >
      {/* โลโก้ */}
      <div className="px-6 py-5 shrink-0 border-b">
        <Logo />
      </div>

      {/* เมนู scroll ได้ */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <FBSidebar aria-label="Main sidebar" theme={fbTheme} className="w-full">
          <FBSidebar.Items className="px-3 py-3">
            <div className="sidebar-nav">
              {menu.map((group, gi) => (
                <React.Fragment key={gi}>
                  <h5 className="text-link font-semibold text-sm caption px-2 py-2">
                    <span className="hide-menu">{group.heading}</span>
                  </h5>
                  <FBSidebar.ItemGroup>
                    {group.children?.map((child, ci) => (
                      <React.Fragment key={child.id ?? ci}>
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
      </div>
    </aside>
  );
}
