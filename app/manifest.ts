import { createShopManifest } from "@/lib/pwa-config";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return createShopManifest();
}
