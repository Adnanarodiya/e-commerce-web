"use client";

import { Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
            aria-label="Noorani Makatib Home"
          >
            NOORANI<span className="text-primary"> MAKATIB</span>
          </Link>

          <a
            href="tel:+919426880068"
            className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4 text-primary shrink-0" />
            <span>+91 94268 80068</span>
          </a>
        </div>
      </div>
    </footer>
  );
}