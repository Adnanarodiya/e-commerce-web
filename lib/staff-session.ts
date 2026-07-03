const ADMIN_KEY = "staff_admin";
const PACKER_KEY = "staff_packer";

export function setStaffSession(role: "admin" | "packer", active: boolean) {
  if (typeof window === "undefined") return;
  const key = role === "admin" ? ADMIN_KEY : PACKER_KEY;
  if (active) {
    localStorage.setItem(key, "1");
  } else {
    localStorage.removeItem(key);
  }
}

export function hasStaffSession(role: "admin" | "packer"): boolean {
  if (typeof window === "undefined") return false;
  const key = role === "admin" ? ADMIN_KEY : PACKER_KEY;
  return localStorage.getItem(key) === "1";
}