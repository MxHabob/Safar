import type { Metadata, Viewport } from "next";
import "./globals.css";
// import { Readex_Pro } from "next/font/google";
import { Providers } from "@/lib/providers";

// const readexPro = Readex_Pro({
//   subsets: ["latin"],
//   display: "swap",
//   preload: true,
// });


export const metadata: Metadata = {
  title: {
    template: "%s - Safar Admin",
    default: "Safar Admin",
  },
  description: "Admin Dashboard for Safar",  
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={` antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
