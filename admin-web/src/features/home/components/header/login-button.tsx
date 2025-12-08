"use client";

import { useRouter } from "next/navigation";

export function LoginButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/login")}
      className="px-4 h-9 text-sm font-light rounded-[18px] border border-input hover:bg-accent transition-colors"
    >
      Login
    </button>
  );
}