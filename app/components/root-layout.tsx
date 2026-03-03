import { Outlet } from "react-router";
import { Header } from "./header";
import { Footer } from "./footer";

export function RootLayout() {
  return (
    <div className="w-full flex flex-col" style={{ background: "#090d1f" }}>
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}