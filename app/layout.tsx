import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "./components/header";
import { Footer } from "./components/Footer";
import { MainWrapper } from "./components/MainWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "./components/CartDrawer";
import { QueryProvider } from "./components/QueryProvider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Immersive Visionary | 3D/AR Production Studio",
  description: "Professional 3D modeling and AR advertising production. Transform products into interactive digital assets in days, not weeks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              <Header />
              <CartDrawer />
              <MainWrapper>
                {children}
              </MainWrapper>
              <Footer />
              <Toaster
                position="top-center"
                richColors
                toastOptions={{ duration: 4000 }}
              />
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
