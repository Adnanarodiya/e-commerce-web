"use client";

import BrandLogo from "@/components/ui/BrandLogo";
import { Globe, Phone } from "lucide-react";

const PHONE = {
  display: "+91 81409 02756",
  href: "tel:+918140902756",
} as const;

const WEBSITE = {
  label: "nooranimakatib.com",
  href: "https://nooranimakatib.com/",
} as const;

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-4 min-w-0">
          <BrandLogo imageClassName="h-9 sm:h-10 w-auto shrink-0" />

          <div className="flex flex-col gap-2.5 sm:items-end min-w-0">
            <a
              href={PHONE.href}
              className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-w-0"
            >
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span className="tabular-nums">{PHONE.display}</span>
            </a>

            <a
              href={WEBSITE.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-w-0 break-all sm:break-normal"
            >
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <span>{WEBSITE.label}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
