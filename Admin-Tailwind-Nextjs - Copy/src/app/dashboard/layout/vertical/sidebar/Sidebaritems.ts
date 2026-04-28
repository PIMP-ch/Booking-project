"use client";

import { uniqueId } from "lodash";

// ─── Types ─────────────────────────────
export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  roles?: string[]; // ✅ เพิ่ม
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  roles?: string[]; // ✅ เพิ่ม
}

// ─── Raw Menu ──────────────────────────
const RAW_SIDEBAR: MenuItem[] = [
  {
    heading: "Dashboards",
    children: [
      {
        name: "Dashboard",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/dashboard",
        roles: ["superadmin", "admin", "staff"],
      },
      {
        name: "จัดการ การจอง",
        icon: "solar:calendar-search-bold",
        id: uniqueId(),
        url: "/dashboard/booking",
        roles: ["admin", "staff"],
      },
      {
        name: "จัดการ สนามกีฬา",
        icon: "solar:football-bold-duotone",
        id: uniqueId(),
        url: "/dashboard/stadium",
        roles: ["admin"],
      },
      {
        name: "จัดการ อุปกรณ์",
        icon: "solar:devices-linear",
        id: uniqueId(),
        url: "/dashboard/equipment",
        roles: ["admin"],
      },
    ],
  },

  {
    heading: "รายงาน",
    children: [
      {
        name: "รายงาน ประวัติการจอง",
        icon: "solar:user-id-bold",
        id: uniqueId(),
        url: "/dashboard/history-booking",
        roles: ["admin", "staff"],
      },
    ],
  },

  {
    heading: "จัดการ ทั่วไป",
    children: [
      {
        name: "พนักงาน",
        icon: "solar:users-group-two-rounded-linear",
        id: uniqueId(),
        url: "/dashboard/staff",
        roles: ["admin"],
      },
      {
        name: "ผู้ใช้งาน",
        icon: "solar:user-circle-bold-duotone",
        id: uniqueId(),
        url: "/dashboard/user",
        roles: ["admin"],
      },
    ],
  },
];

// ─── Helper: get role from sessionStorage ─────────
const getUserRole = (): string => {
  if (typeof window === "undefined") return "";

  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    return user?.role || "";
  } catch {
    return "";
  }
};

// ─── Filter ─────────────────────────────
const filterMenu = (menu: MenuItem[], role: string): MenuItem[] => {
  return menu
    .map((section) => ({
      ...section,
      children: section.children?.filter(
        (item) => !item.roles || item.roles.includes(role)
      ),
    }))
    .filter((section) => section.children && section.children.length > 0);
};

// ─── Export ใช้งานได้เลย ───────────────
const SidebarContent: MenuItem[] = filterMenu(
  RAW_SIDEBAR,
  getUserRole()
);

export default SidebarContent;