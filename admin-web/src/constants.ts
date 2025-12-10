import {
    SquareTerminal,
    LifeBuoy,
    Cog,
    Users,
    Home,
    Calendar,
    CreditCard,
    LayoutDashboard,
  } from "lucide-react";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 100;

// Upload image limit is 20MB
export const IMAGE_SIZE_LIMIT = 50 * 1024 * 1024;

// Upload default folder
export const DEFAULT_PHOTOS_UPLOAD_FOLDER = "photos";

  
  export const sidebarMenus = {
    user: {
      name: "Admin",
      email: "admin@safae.com",
      avatar: "",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        isActive: true,
        items: [
          {
            title: "Overview",
            url: "/",
          },
        ],
      },
      {
        title: "Users",
        url: "/users",
        icon: Users,
        isActive: false,
      },
      {
        title: "Listings",
        url: "/listings",
        icon: Home,
        isActive: false,
      },
      {
        title: "Bookings",
        url: "/bookings",
        icon: Calendar,
        isActive: false,
      },
      {
        title: "Payments",
        url: "/payments",
        icon: CreditCard,
        isActive: false,
      },
    ],
    adminNavMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: "Users",
        url: "/users",
        icon: Users,
        isActive: false,
      },
      {
        title: "Listings",
        url: "/listings",
        icon: Home,
        isActive: false,
      },
      {
        title: "Bookings",
        url: "/bookings",
        icon: Calendar,
        isActive: false,
      },
      {
        title: "Payments",
        url: "/payments",
        icon: CreditCard,
        isActive: false,
      },
    ],
    navSecondary: [
      {
        title: "Admin Settings",
        url: "/profile",
        icon: Cog,
      },
      {
        title: "Support",
        url: "/IT",
        icon: LifeBuoy,
      },
    ],
    adminNavSecondary: [
      {
        title: "Admin Settings",
        url: "/profile",
        icon: Cog,
      },
      {
        title: "Support",
        url: "/IT",
        icon: LifeBuoy,
      },
    ],
  };
  