"use client";
import React from "react";
import { ChildItem } from "../Sidebaritems";
import { Sidebar } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemsProps {
  item: ChildItem;
  onItemClick?: () => void;
}

const NavItems: React.FC<NavItemsProps> = ({ item, onItemClick }) => {
  const pathname = usePathname();
  const active = item.url === pathname;

  return (
    <Sidebar.Item
      href={item.url}
      as={Link}
      onClick={onItemClick}
      className={`${active ? "!text-primary bg-lightprimary " : "text-link bg-transparent group/link "}`}
    >
      <span className="flex items-center gap-3 truncate">
        {item.icon && <Icon icon={item.icon} className={item.color ?? ""} height={18} />}
        <span className="max-w-36 overflow-hidden hide-menu">{item.name}</span>
      </span>
    </Sidebar.Item>
  );
};

export default NavItems;
