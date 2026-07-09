"use client";

import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import type { PincodeStatus } from "@/context/CartContext";
import { Loader2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

interface PincodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  status: PincodeStatus;
  state?: string;
  district?: string;
  isGujarat?: boolean;
  error?: string;
  required?: boolean;
}

export default function PincodeField({
  value,
  onChange,
  status,
  state,
  district,
  isGujarat,
  error,
  required = true,
}: PincodeFieldProps) {
  const { t, isRtl } = useLanguage();

  return (
    <div className="space-y-1.5 text-start" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
        {t("zipCode")}
        {required ? " *" : ""}
      </label>
      <div className="relative">
        <Input
          name="zipCode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="380001"
          className={`pr-10 tabular-nums ${error || status === "invalid" ? "border-destructive" : status === "valid" ? "border-emerald-500" : ""}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {status === "loading" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {status === "valid" && (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
          {status === "invalid" && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {status === "valid" && state && (
        <p className="text-xs text-emerald-700 flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            {district ? `${district}, ` : ""}
            {state}
            {isGujarat !== undefined && (
              <span className="font-semibold">
                {" "}
                — {isGujarat ? t("gujaratRate") : t("outsideGujaratRate")}
              </span>
            )}
          </span>
        </p>
      )}

      {status === "invalid" && !error && (
        <p className="text-xs text-destructive">{t("invalidPincode")}</p>
      )}

      {status === "idle" && value.length > 0 && value.length < 6 && (
        <p className="text-xs text-muted-foreground">{t("pincodeHint")}</p>
      )}
    </div>
  );
}
