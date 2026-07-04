import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO, BRAND_LOGO_ALT } from "@/lib/brand";

interface BrandLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export default function BrandLogo({
  href = "/",
  className = "",
  imageClassName = "h-10 sm:h-12 w-auto",
  priority = false,
}: BrandLogoProps) {
  const image = (
    <Image
      src={BRAND_LOGO}
      alt={BRAND_LOGO_ALT}
      width={220}
      height={80}
      priority={priority}
      className={`object-contain object-left ${imageClassName}`}
    />
  );

  if (!href) {
    return <div className={className}>{image}</div>;
  }

  return (
    <Link href={href} className={`inline-flex shrink-0 ${className}`} aria-label={`${BRAND_LOGO_ALT} Home`}>
      {image}
    </Link>
  );
}
