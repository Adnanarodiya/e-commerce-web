import {
  PWA_ADMIN_DESCRIPTION,
  PWA_ADMIN_NAME,
  PWA_ADMIN_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa-config";
import { BRAND_LOGO } from "@/lib/brand";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  applicationName: PWA_ADMIN_NAME,
  title: {
    default: PWA_ADMIN_NAME,
    template: `%s | ${PWA_ADMIN_SHORT_NAME}`,
  },
  description: PWA_ADMIN_DESCRIPTION,
  manifest: "/admin/manifest.webmanifest",
  icons: {
    icon: BRAND_LOGO,
    apple: BRAND_LOGO,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_ADMIN_SHORT_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
