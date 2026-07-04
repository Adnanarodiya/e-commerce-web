import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PWA_NAME } from "@/lib/pwa-config";

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
        <WifiOff className="h-8 w-8 text-amber-700" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">You&apos;re offline</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        {PWA_NAME} needs an internet connection to load books and place orders.
        Check your connection and try again.
      </p>
      <Button asChild className="mt-6 bg-primary text-primary-foreground">
        <Link href="/">Try again</Link>
      </Button>
    </div>
  );
}
