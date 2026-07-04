"use client";

import { cn } from "@/lib/utils";
import { useLockBodyScroll } from "@/lib/use-lock-body-scroll";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  header?: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  className?: string;
  closeOnOverlay?: boolean;
}

const maxWidthClass = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-xl",
};

export default function MobileSheet({
  open,
  onClose,
  children,
  title,
  description,
  header,
  footer,
  maxWidth = "md",
  className,
  closeOnOverlay = true,
}: MobileSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useLockBodyScroll(open && mounted);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm overscroll-none touch-none"
      onClick={closeOnOverlay ? onClose : undefined}
      role="presentation"
    >
      <div
        className={cn(
          "bg-white w-full flex flex-col shadow-2xl border border-gray-200 overflow-hidden",
          "h-[90dvh] max-h-[90dvh] rounded-t-2xl",
          "sm:h-auto sm:max-h-[90vh] sm:rounded-2xl",
          maxWidthClass[maxWidth],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {header ?? (title ? (
          <div className="shrink-0 px-4 pt-2 pb-3 sm:px-6 sm:pt-5 border-b border-slate-100 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{title}</h2>
              {description ? (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-1 rounded-full hover:bg-slate-100 shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        ) : null)}

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 px-4 py-4 sm:px-6 border-t border-slate-100 bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
