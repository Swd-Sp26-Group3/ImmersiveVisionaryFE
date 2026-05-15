"use client";
import { usePathname } from "next/navigation";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main>
      {children}
    </main>
  );
}
