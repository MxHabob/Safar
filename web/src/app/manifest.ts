import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "Safar - Travel Guides & Stories",
    short_name: "Safar",
    description: "Discover amazing travel destinations, stories, and guides. Share your travel experiences and explore the world with Safar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait-primary",
    lang: "en",
    dir: "ltr",
    categories: ["travel", "lifestyle", "photography"],
    icons: [
      {
        src: "/images/logo-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/images/logo-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "/images/screenshot1.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow"
      },
      {
        src: "/images/screenshot2.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide"
      }
    ],
    shortcuts: [
      {
        name: "Browse Listings",
        short_name: "Listings",
        description: "Browse available accommodations",
        url: "/listings",
        icons: [{ src: "/logo.png", sizes: "96x96" }]
      },
      {
        name: "Discover",
        short_name: "Discover",
        description: "Discover new destinations",
        url: "/discover",
        icons: [{ src: "/logo.png", sizes: "96x96" }]
      }
    ],
    share_target: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url"
      }
    }
  }
}
