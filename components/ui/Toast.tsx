"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  variant?: "info" | "success";
}

export default function Toast({ message, visible, onClose, variant = "info" }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in slide-in-from-bottom-4",
        variant === "success"
          ? "bg-green-600 text-white border-green-700"
          : "bg-primary text-primary-foreground border-primary/30"
      )}
      role="alert"
    >
      <span>{message}</span>
      <button type="button" onClick={onClose} className="opacity-80 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}