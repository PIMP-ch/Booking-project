export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
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
}

import { uniqueId } from "lodash";

const SidebarContent: MenuItem[] = [
  {
    heading: "Dashboards",
    children: [
      {
        name: "Dashboard",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/dashboard",
      },
      {
        name: "จัดการ กานจอง",
        icon: "solar:calendar-search-bold",
        id: uniqueId(),
        url: "/dashboard/booking",
      },
      {
        name: "จัดการ สนามกีฬา",
        icon: "solar:football-bold-duotone",
        id: uniqueId(),
        url: "/dashboard/stadium",
      },
      {
        name: "จัดการ อุปกรณ์",
        icon: "solar:devices-linear",
        id: uniqueId(),
        url: "/dashboard/equipment",
      },
    ],
  },

  {
    heading: "รายงาน",
    children: [
      {
        name: "รายงาน ปะวัติกานจอง",
        icon: "solar:user-id-bold",
        id: uniqueId(),
        url: "/dashboard/history-booking",
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
      },
      {
        name: "ผู้ใช้งาน",
        icon: "solar:user-circle-bold-duotone",
        id: uniqueId(),
        url: "/dashboard/user",
      },
    ],
  },
];

export default SidebarContent;
