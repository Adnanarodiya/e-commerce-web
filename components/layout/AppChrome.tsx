"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { usePathname } from "next/navigation";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaffRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/packer");

  if (isStaffRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}