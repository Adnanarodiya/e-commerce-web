import AppChrome from "@/components/layout/AppChrome";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Noorani Makatib",
  description:
    "Discover a wide selection of educational Islamic and Urdu books for children and beginners. Enjoy fast delivery and secure payments.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className}  antialiased flex flex-col min-h-screen`}
      >
        <LanguageProvider>
          <CartProvider>
            <AppChrome>{children}</AppChrome>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
