import {
  LayoutDashboard,
  CalendarCheck2,
  Layers,
  Scissors,
  Users,
  UserCog,
  Gift,
} from "lucide-react";

export const adminMenu = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarCheck2 },
  { label: "Categories", path: "/admin/categories", icon: Layers },
  { label: "Services", path: "/admin/services", icon: Scissors },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Staff", path: "/admin/staff", icon: UserCog },
  { label: "Rewards", path: "/admin/rewards", icon: Gift },
];
