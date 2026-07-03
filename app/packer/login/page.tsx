"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { setStaffSession } from "@/lib/staff-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package } from "lucide-react";
import Link from "next/link";

export default function PackerLogin() {
  const { isRtl, setUserRole } = useLanguage();
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/packer/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (res.ok) {
        setStaffSession("packer", true);
        setUserRole("packer");
        router.push("/packer");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (isRtl ? "غلط پاس کوڈ" : "Invalid passcode"));
      }
    } catch {
      setError(isRtl ? "نیٹ ورک خرابی" : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl">
            {isRtl ? "پیکر رسائی" : "Packer Access"}
          </CardTitle>
          <CardDescription>
            {isRtl
              ? "پیکنگ پینل کے لیے پاس کوڈ درج کریں"
              : "Enter the packer passcode to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            <Input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder={isRtl ? "پیکر پاس کوڈ" : "Packer passcode"}
              required
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              disabled={loading || !passcode}
            >
              {loading
                ? isRtl
                  ? "تصدیق ہو رہی ہے..."
                  : "Verifying..."
                : isRtl
                ? "داخل کریں"
                : "Unlock Packer"}
            </Button>
            <Link
              href="/"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              {isRtl ? "اسٹور پر واپس" : "Back to store"}
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}