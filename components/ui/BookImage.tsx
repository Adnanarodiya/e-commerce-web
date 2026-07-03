"use client";

import { hasValidBookImage } from "@/lib/book-image";
import { cn } from "@/lib/utils";
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
  const showFallback = !hasValidBookImage(src) || imageError;

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