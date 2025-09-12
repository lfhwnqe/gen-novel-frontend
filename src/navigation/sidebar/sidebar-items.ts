import {
  // ShoppingBag,
  // Forklift,
  // Mail,
  // MessageSquare,
  // Calendar,
  // Kanban,
  // ReceiptText,
  // Users,
  // Lock,
  // Fingerprint,
  // SquareArrowUpRight,
  ChartBar,
  Banknote,
  // Gauge,
  // GraduationCap,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

import { Role } from "@/types/auth";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  roles?: Role[]; // 允许访问的角色列表，为空表示所有角色都可访问
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  roles?: Role[]; // 允许访问的角色列表，为空表示所有角色都可访问
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// 是否为本地开发环境
export const IS_DEV = process.env.NODE_ENV === "development";

// 基础（生产）菜单
const baseSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      // 模板页面
      // {
      //   title: "Default",
      //   url: "/dashboard/default",
      //   icon: LayoutDashboard,
      // },
      {
        title: "产品管理",
        url: "/dashboard/products",
        icon: LayoutDashboard,
        roles: [Role.ADMIN, Role.SUPER_ADMIN], // 只有管理员可以访问
      },
      // {
      //   title: "CRM",
      //   url: "/dashboard/crm",
      //   icon: ChartBar,
      // },
      // {
      //   title: "Finance",
      //   url: "/dashboard/finance",
      //   icon: Banknote,
      // },
      // {
      //   title: "Analytics",
      //   url: "/dashboard/analytics",
      //   icon: Gauge,
      //   comingSoon: true,
      // },
      // {
      //   title: "E-commerce",
      //   url: "/dashboard/e-commerce",
      //   icon: ShoppingBag,
      //   comingSoon: true,
      // },
      // {
      //   title: "Academy",
      //   url: "/dashboard/academy",
      //   icon: GraduationCap,
      //   comingSoon: true,
      // },
      // {
      //   title: "Logistics",
      //   url: "/dashboard/logistics",
      //   icon: Forklift,
      //   comingSoon: true,
      // },
    ],
  },
];

// dev 环境下追加到 Dashboards 分组的菜单（示例：模板/演示页面）
const devDashboardItems: NavMainItem[] = [
  {
    title: "Default",
    url: "/dashboard/default",
    icon: LayoutDashboard,
  },
  {
    title: "CRM",
    url: "/dashboard/crm",
    icon: ChartBar,
  },
  {
    title: "Finance",
    url: "/dashboard/finance",
    icon: Banknote,
  },
];

// 合并逻辑：dev 环境将 devDashboardItems 合并到 Dashboards 分组末尾
const withDevSidebarItems = (): NavGroup[] => {
  if (!IS_DEV) return baseSidebarItems;

  return baseSidebarItems.map((group) => {
    if (group.label === "Dashboards") {
      return {
        ...group,
        items: [...group.items, ...devDashboardItems],
      };
    }
    return group;
  });
};

// 根据用户角色过滤菜单项
export const filterMenuByRole = (menuGroups: NavGroup[], userRole?: string): NavGroup[] => {
  if (!userRole) return []; // 没有角色信息，不显示任何菜单

  return menuGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          // 如果菜单项没有指定 roles，则所有角色都可以访问
          if (!item.roles || item.roles.length === 0) {
            return true;
          }
          // 检查用户角色是否在允许的角色列表中
          return item.roles.includes(userRole as Role);
        })
        .map((item) => ({
          ...item,
          // 如果有子菜单，也要进行角色过滤
          subItems: item.subItems?.filter((subItem) => {
            if (!subItem.roles || subItem.roles.length === 0) {
              return true;
            }
            return subItem.roles.includes(userRole as Role);
          }),
        })),
    }))
    .filter((group) => group.items.length > 0); // 过滤掉没有菜单项的分组
};

export const sidebarItems: NavGroup[] = withDevSidebarItems();
