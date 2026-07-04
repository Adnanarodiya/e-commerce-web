"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedBodyOverflow = "";
let savedBodyPaddingRight = "";
let savedHtmlOverflow = "";

function lockScroll() {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    savedBodyPaddingRight = document.body.style.paddingRight;
    savedHtmlOverflow = document.documentElement.style.overflow;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount += 1;
}

function unlockScroll() {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
    document.body.style.paddingRight = savedBodyPaddingRight;
    document.documentElement.style.overflow = savedHtmlOverflow;
  }
}

/** Prevents the page behind a modal from scrolling (supports nested modals). */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    lockScroll();
    return () => unlockScroll();
  }, [locked]);
}
