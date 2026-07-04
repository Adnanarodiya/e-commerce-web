import { HERO_BANNER, HERO_BANNER_ALT } from "@/lib/brand";
import Image from "next/image";

export default function HomeHero() {
  return (
    <section
      className="relative w-full border-b border-border overflow-hidden bg-secondary/30"
      aria-label="Noorani Makatib bookstore banner"
    >
      <div className="relative aspect-[16/7] sm:aspect-[21/8] lg:aspect-[21/7] max-h-[480px] w-full">
        <Image
          src={HERO_BANNER}
          alt={HERO_BANNER_ALT}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-background/10 to-transparent" />
      </div>
    </section>
  );
}
