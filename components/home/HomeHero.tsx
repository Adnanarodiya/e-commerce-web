"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BookMarked, Library } from "lucide-react";

function BookShelf({ mirrored }: { mirrored?: boolean }) {
  const books = [
    { h: "h-16", color: "bg-primary/70" },
    { h: "h-20", color: "bg-primary/50" },
    { h: "h-14", color: "bg-accent" },
    { h: "h-[4.5rem]", color: "bg-primary/40" },
    { h: "h-12", color: "bg-secondary" },
  ];

  return (
    <div
      className={`hidden md:flex flex-col items-end justify-end gap-1 w-24 lg:w-32 shrink-0 opacity-60 ${
        mirrored ? "items-start" : "items-end"
      }`}
      aria-hidden="true"
    >
      <div
        className={`flex items-end gap-1 ${mirrored ? "flex-row" : "flex-row-reverse"}`}
      >
        {books.map((book, i) => (
          <div
            key={i}
            className={`w-4 lg:w-5 rounded-sm ${book.h} ${book.color} border border-primary/10 shadow-sm`}
          />
        ))}
      </div>
      <div className="w-full h-1.5 bg-border rounded-full" />
      <Library className="h-5 w-5 text-primary/30 mt-1" />
    </div>
  );
}

export default function HomeHero() {
  const { t, isRtl } = useLanguage();

  const kitabTypes = [
    t("kitabQuran"),
    t("kitabHadith"),
    t("kitabUrdu"),
    t("kitabKids"),
  ];

  return (
    <section
      className="flex justify-center items-center h-10 pt-5"
      aria-label="Noorani Makatib bookstore"
    >
      {/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.8952_0.0504_146.0366/0.15),transparent_65%)]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between gap-4 py-10 sm:py-14 lg:py-16 ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <BookShelf mirrored={isRtl} />

          <div className="flex-1 text-center space-y-3 sm:space-y-4 max-w-xl mx-auto">
           

            <h1
              className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight text-balance"
              style={{ direction: isRtl ? "rtl" : "ltr" }}
            >
              {t("heroHeadline")}
            </h1>

            <p
              className="text-sm sm:text-base text-muted-foreground text-balance leading-relaxed"
              style={{ direction: isRtl ? "rtl" : "ltr" }}
            >
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {kitabTypes.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-md bg-accent/60 px-2.5 py-1 text-xs font-medium text-accent-foreground"
                >
                  <BookMarked className="h-3 w-3 text-primary/70" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <BookShelf mirrored={!isRtl} />
        </div>
      </div> */}
      <p className="font-serif text-base sm:text-lg font-bold italic text-primary">
        {t("heroTagline")}
      </p>
    </section>
  );
}
