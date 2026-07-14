"use client";

import { hasValidBookImage, isPdfBookFile } from "@/lib/book-image";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface BookImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
}

export default function BookImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  containerClassName,
  priority,
  sizes,
}: BookImageProps) {
  const [imageError, setImageError] = useState(false);
  const isPdf = isPdfBookFile(src);
  const showFallback = !hasValidBookImage(src) || imageError;

  if (isPdf && src) {
    // Use a div (not <a>) so this is safe inside product card <Link>s
    return (
      <div
        title={`PDF: ${alt}`}
        className={cn(
          "bg-amber-50 flex flex-col items-center justify-center gap-1 text-center p-2",
          fill ? "absolute inset-0" : "w-full h-full",
          containerClassName,
          className
        )}
      >
        <FileText className="h-6 w-6 text-amber-700 shrink-0" aria-hidden />
        <span className="text-[10px] sm:text-xs font-semibold text-amber-800 uppercase tracking-wide">
          PDF
        </span>
        <span className="text-gray-600 text-[10px] sm:text-xs font-medium leading-snug line-clamp-2 px-1">
          {alt}
        </span>
      </div>
    );
  }

  if (showFallback) {
    return (
      <div
        className={cn(
          "bg-gray-200 flex items-center justify-center text-center p-3",
          fill ? "absolute inset-0" : "w-full h-full",
          containerClassName
        )}
      >
        <span className="text-gray-600 text-xs sm:text-sm font-semibold leading-snug line-clamp-4">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src!}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setImageError(true)}
    />
  );
}
