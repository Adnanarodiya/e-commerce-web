/** Shared mobile min-height for buttons (36px); normal sizes from sm+ */
export const touchMobileMin = "min-h-[36px]";

export const touchBtn =
  `${touchMobileMin} h-auto py-2 text-sm sm:min-h-0 sm:h-9 sm:py-2 sm:text-sm`;

export const touchBtnSm =
  `${touchMobileMin} h-auto py-1.5 text-sm sm:min-h-0 sm:h-8 sm:py-0 sm:text-xs`;

export const touchBtnLg =
  `${touchMobileMin} h-auto py-2 text-sm font-semibold sm:min-h-0 sm:h-10 sm:py-2 sm:text-sm`;

/** Toggle / choice buttons (delivery, payment, tabs) */
export const touchChoice =
  `${touchMobileMin} py-2 sm:min-h-0 sm:py-2`;

/** Icon-only controls in header / toolbars */
export const touchIconBtn =
  `${touchMobileMin} min-w-[36px] sm:min-h-0 sm:min-w-0`;
