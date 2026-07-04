"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLockBodyScroll } from "@/lib/use-lock-body-scroll";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  headerTone?: "primary" | "green" | "slate";
  icon?: ReactNode;
  children?: ReactNode;
}

const headerToneClass: Record<NonNullable<ConfirmModalProps["headerTone"]>, string> = {
  primary: "bg-primary",
  green: "bg-emerald-600",
  slate: "bg-slate-800",
};

const confirmToneClass: Record<NonNullable<ConfirmModalProps["headerTone"]>, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  green: "bg-emerald-600 hover:bg-emerald-700 text-white",
  slate: "bg-slate-800 hover:bg-slate-900 text-white",
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
  headerTone = "primary",
  icon,
  children,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useLockBodyScroll(open && mounted);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-none touch-none"
      onClick={loading ? undefined : onCancel}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`${headerToneClass[headerTone]} px-5 py-4 flex items-start justify-between gap-3 text-white`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon ? (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                {icon}
              </div>
            ) : null}
            <h3 className="text-lg font-bold leading-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-white/20 shrink-0 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-left">
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
          {children}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              className={`flex-1 font-semibold ${confirmToneClass[headerTone]}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Please wait…" : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
