import AppChrome from "@/components/layout/AppChrome";
import { SerwistProvider } from "@/components/providers/SerwistProvider";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import {
  PWA_DESCRIPTION,
  PWA_NAME,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa-config";
import { BRAND_LOGO, BRAND_LOGO_ALT } from "@/lib/brand";
import type { Metadata, Viewport } from "next";
import {
  Merriweather,
  Montserrat,
  Source_Code_Pro,
} from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: PWA_NAME,
  title: {
    default: PWA_NAME,
    template: `%s | ${PWA_SHORT_NAME}`,
  },
  description: PWA_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: BRAND_LOGO,
    apple: BRAND_LOGO,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_SHORT_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: PWA_NAME,
    title: PWA_NAME,
    description: PWA_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: PWA_NAME,
    description: PWA_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${merriweather.variable} ${sourceCodePro.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <SerwistProvider swUrl="/serwist/sw.js">
          <LanguageProvider>
            <CartProvider>
              <AppChrome>{children}</AppChrome>
            </CartProvider>
          </LanguageProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
