import { BRAND_LOGO } from "@/lib/brand";
import type { MetadataRoute } from "next";

export const PWA_NAME = "Noorani Makatib";
export const PWA_SHORT_NAME = "Noorani";
export const PWA_ADMIN_NAME = "Noorani Makatib Admin";
export const PWA_ADMIN_SHORT_NAME = "Admin";
export const PWA_PACKER_NAME = "Noorani Makatib Packer";
export const PWA_PACKER_SHORT_NAME = "Packer";
export const PWA_DESCRIPTION =
  "Educational Islamic and Urdu books — browse, order, and shop with fast delivery.";
export const PWA_ADMIN_DESCRIPTION =
  "Admin panel — manage orders, stock, books, and ledger for Noorani Makatib.";
export const PWA_PACKER_DESCRIPTION =
  "Packer panel — view and pack orders for Noorani Makatib.";
export const PWA_THEME_COLOR = "#1e6b45";
export const PWA_BACKGROUND_COLOR = "#ffffff";

const PWA_ICONS: NonNullable<MetadataRoute.Manifest["icons"]> = [
  {
    src: BRAND_LOGO,
    sizes: "512x512",
    type: "image/jpeg",
    purpose: "any",
  },
  {
    src: BRAND_LOGO,
    sizes: "512x512",
    type: "image/jpeg",
    purpose: "maskable",
  },
];

export function createShopManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PWA_NAME,
    short_name: PWA_SHORT_NAME,
    description: PWA_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["books", "shopping", "education"],
    icons: PWA_ICONS,
  };
}

export function createAdminManifest(): MetadataRoute.Manifest {
  return {
    id: "/admin/",
    name: PWA_ADMIN_NAME,
    short_name: PWA_ADMIN_SHORT_NAME,
    description: PWA_ADMIN_DESCRIPTION,
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["business", "productivity"],
    icons: PWA_ICONS,
  };
}

export function createPackerManifest(): MetadataRoute.Manifest {
  return {
    id: "/packer/",
    name: PWA_PACKER_NAME,
    short_name: PWA_PACKER_SHORT_NAME,
    description: PWA_PACKER_DESCRIPTION,
    start_url: "/packer",
    scope: "/packer",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["business", "productivity"],
    icons: PWA_ICONS,
  };
}
