import { Font } from "@react-pdf/renderer";

let registered = false;

/** Register Noto Naskh Arabic for Urdu book names in PDFs (call once before render). */
export function registerPdfFonts(): void {
  if (registered) return;

  Font.register({
    family: "NotoNaskhArabic",
    fonts: [
      {
        src: "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoNaskhArabic/hinted/ttf/NotoNaskhArabic-Regular.ttf",
        fontWeight: 400,
      },
      {
        src: "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoNaskhArabic/hinted/ttf/NotoNaskhArabic-Bold.ttf",
        fontWeight: 700,
      },
    ],
  });

  registered = true;
}

export const PDF_FONT_LATIN = "Helvetica";
export const PDF_FONT_URDU = "NotoNaskhArabic";

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export function pdfFontForText(text: string): string {
  return ARABIC_SCRIPT.test(text) ? PDF_FONT_URDU : PDF_FONT_LATIN;
}
