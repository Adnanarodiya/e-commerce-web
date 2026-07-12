import {
  PWA_PACKER_DESCRIPTION,
  PWA_PACKER_NAME,
  PWA_PACKER_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa-config";
import { BRAND_LOGO } from "@/lib/brand";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  applicationName: PWA_PACKER_NAME,
  title: {
    default: PWA_PACKER_NAME,
    template: `%s | ${PWA_PACKER_SHORT_NAME}`,
  },
  description: PWA_PACKER_DESCRIPTION,
  manifest: "/packer/manifest.webmanifest",
  icons: {
    icon: BRAND_LOGO,
    apple: BRAND_LOGO,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_PACKER_SHORT_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: PWA_THEME_COLOR,
};

export default function PackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
