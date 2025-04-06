import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ReduxProvider from "@/components/providers/redux-provider";
import { Toaster } from "sonner";
import { Nav } from "@/components/section/header/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Safar",
  description: "Safar is a travel app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased custom-scrollbar`}
      >
      <ReduxProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange >
      <main className="min-h-screen flex flex-col">
         <Nav />
        {children}
      </main>
        {/* <footer className="border-t py-6 md:py-0">
        <div className="flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left ml-11">
            © {new Date().getFullYear()} Safar. All rights reserved.
          </p>
        </div>
      </footer> */}
        <Toaster position="bottom-center"/>
      </ThemeProvider>
      </ReduxProvider>
      </body>
    </html>
  );
}
