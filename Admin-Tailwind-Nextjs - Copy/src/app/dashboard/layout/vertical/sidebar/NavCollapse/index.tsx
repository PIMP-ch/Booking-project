"use client";
import { Sidebar } from "flowbite-react";
import React from "react";
import { ChildItem } from "../Sidebaritems";
import NavItems from "../NavItems";
import { Icon } from "@iconify/react";
import { HiOutlineChevronDown } from "react-icons/hi";
import { twMerge } from "tailwind-merge";
import { usePathname } from "next/navigation";

interface NavCollapseProps {
  item: ChildItem;
  onItemClick?: () => void;
}

const NavCollapse: React.FC<NavCollapseProps> = ({ item, onItemClick }) => {
  const pathname = usePathname();
  const children = item?.children ?? [];
  const activeDD = children.find((t: { url?: string }) => t?.url === pathname);

  return (
    <Sidebar.Collapse
      label={item.name} // ✅ โชว์ชื่อเมนูตลอด
      open={!!activeDD}
      icon={() => <Icon icon={item.icon} height={18} />}
      className={`${activeDD ? "!text-primary bg-lightprimary " : ""} collapse-menu`}
      renderChevronIcon={(theme, open) => {
        const IconComponent = HiOutlineChevronDown;
        return (
          <IconComponent
            aria-hidden
            className={`${twMerge(theme.label.icon.open[open ? "on" : "off"])} drop-icon`}
          />
        );
      }}
    >
      {children.length > 0 && (
        <Sidebar.ItemGroup className="sidebar-dropdown">
          {children.map((child: any, idx: number) => (
            <React.Fragment key={child.id ?? idx}>
              {child.children ? (
                <NavCollapse item={child} onItemClick={onItemClick} />
              ) : (
                <NavItems item={child} onItemClick={onItemClick} />
              )}
            </React.Fragment>
          ))}
        </Sidebar.ItemGroup>
      )}
    </Sidebar.Collapse>
  );
};

export default NavCollapse;
