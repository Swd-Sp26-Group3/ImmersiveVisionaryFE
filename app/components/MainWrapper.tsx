"use client";
import { usePathname } from "next/navigation";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  
  return (
    <main className={isAuthPage ? "pt-0" : "pt-25"}>
      {children}
    </main>
  );
}
