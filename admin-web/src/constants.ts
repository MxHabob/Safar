import {
    SquareTerminal,
    LifeBuoy,
    Cog,
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
        icon: SquareTerminal,
        isActive: true,
        items: [
          {
            title: "Overview",
            url: "/",
          },
        ],
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
  };
  