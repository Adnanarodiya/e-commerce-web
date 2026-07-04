"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Download } from "lucide-react";

export default function StaffInstallHint({ role }: { role: "admin" | "packer" }) {
  const { isRtl } = useLanguage();

  const title =
    role === "admin"
      ? isRtl
        ? "ایڈمن ایپ انسٹال کریں"
        : "Install Admin App"
      : isRtl
      ? "پیکر ایپ انسٹال کریں"
      : "Install Packer App";

  const steps = isRtl
    ? role === "admin"
      ? "اس صفحے (/admin) پر رہیں → براؤزر مینو → «Install app» یا «Add to Home Screen»۔ انسٹال کے بعد ایپ براہِ راست ایڈمن پینل کھولے گی۔"
      : "اس صفحے (/packer) پر رہیں → براؤزر مینو → «Install app» یا «Add to Home Screen»۔ انسٹال کے بعد ایپ براہِ راست پیکر پینل کھولے گی۔"
    : role === "admin"
    ? "Stay on this page (/admin) → open browser menu → choose “Install app” or “Add to Home Screen”. The installed app opens the admin panel directly."
    : "Stay on this page (/packer) → open browser menu → choose “Install app” or “Add to Home Screen”. The installed app opens the packer panel directly.";

  return (
    <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-left">
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p
            className="text-sm font-semibold text-foreground"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            {title}
          </p>
          <p
            className="text-xs text-muted-foreground leading-relaxed"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            {steps}
          </p>
        </div>
      </div>
    </div>
  );
}
