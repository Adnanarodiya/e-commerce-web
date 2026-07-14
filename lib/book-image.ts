export function hasValidBookImage(image?: string | null): boolean {
  if (!image) return false;
  const trimmed = image.trim();
  return trimmed.length > 0 && trimmed !== "null" && trimmed !== "undefined";
}

/** True when the stored cover URL points at a PDF (not a raster image). */
export function isPdfBookFile(image?: string | null): boolean {
  if (!hasValidBookImage(image)) return false;
  const url = image!.trim().split("?")[0].toLowerCase();
  return url.endsWith(".pdf");
}