import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Host Dashboard ",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return <>{children}</>;
}

