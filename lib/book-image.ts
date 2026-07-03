export function hasValidBookImage(image?: string | null): boolean {
  if (!image) return false;
  const trimmed = image.trim();
  return trimmed.length > 0 && trimmed !== "null" && trimmed !== "undefined";
}