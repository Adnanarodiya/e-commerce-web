import type { MetadataRoute } from "next";
import { BRAND_LOGO } from "@/lib/brand";
import {
  PWA_BACKGROUND_COLOR,
  PWA_DESCRIPTION,
  PWA_NAME,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR,
} from "@/lib/pwa-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
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
    icons: [
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
    ],
  };
}
