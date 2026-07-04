"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/supabase";
import { hasStaffSession } from "@/lib/staff-session";
import { Menu, Search, ShoppingCart, X, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface SearchBook {
  id: number;
  name_en: string;
  name_ur: string;
  price: number;
  image: string;
  stock: number;
}

export default function Header() {
  const { cart } = useCart();
  const { language, setLanguage, t, isRtl } = useLanguage();

  const cartCount =
    cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [staff, setStaff] = useState({ admin: false, packer: false });
  const [allBooks, setAllBooks] = useState<SearchBook[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setStaff({
      admin: hasStaffSession("admin"),
      packer: hasStaffSession("packer"),
    });
  }, [pathname]);

  // Load book catalog once for client-side search
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const books = await db.getBooks();
        if (!cancelled) {
          setAllBooks(
            books.map((b) => ({
              id: b.id,
              name_en: b.name_en,
              name_ur: b.name_ur,
              price: Number(b.price),
              image: b.image,
              stock: b.stock,
            }))
          );
          console.debug("[search] catalog loaded:", books.length, "books");
        }
      } catch (err) {
        console.error("[search] failed to load catalog:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce search query
  useEffect(() => {
    setSearchLoading(true);
    console.debug("[search] query changed:", searchQuery);
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return [];
    const results = allBooks.filter((b) => {
      return (
        b.name_en.toLowerCase().includes(q) ||
        b.name_ur.toLowerCase().includes(q)
      );
    });
    console.debug("[search] results for", q, ":", results.length);
    return results.slice(0, 6);
  }, [debouncedQuery, allBooks]);

  const showDropdown =
    isSearchOpen && debouncedQuery.length > 0 && searchResults.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    if (!isSearchOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-search-container]")) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchOpen]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const handleSearchFocus = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
    },
    []
  );

  const handleResultClick = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setDebouncedQuery("");
  }, []);

  const isActivePath = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const navItems = [
    { href: "/contact", label: t("phone") === "Phone" ? "Contact" : "رابطہ کریں" },
  ];

  const isStaffRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/packer");

  const staffLinks = isStaffRoute
    ? [
        ...(staff.admin ? [{ href: "/admin", label: t("adminPanel") }] : []),
        ...(staff.packer ? [{ href: "/packer", label: t("packerPanel") }] : []),
      ]
    : [];

  const renderSearchDropdown = (inputId: string) => {
    if (!showDropdown) return null;
    return (
      <div
        id={`${inputId}-dropdown`}
        className={`absolute z-50 mt-2 ${
          isRtl ? "right-0" : "left-0"
        } w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto`}
        role="listbox"
        aria-label="Search results"
      >
        {searchLoading ? (
          <div className="p-3 text-xs text-muted-foreground">Searching…</div>
        ) : (
          searchResults.map((book) => {
            const name =
              language === "ur"
                ? book.name_ur || book.name_en
                : book.name_en || book.name_ur;
            return (
              <Link
                key={book.id}
                href={`/product/${book.id}`}
                onClick={handleResultClick}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 border-b last:border-0 transition-colors"
                role="option"
                aria-selected="false"
              >
                <div className="relative w-10 h-12 shrink-0 bg-muted/30 border rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={book.image}
                    alt={name}
                    className="absolute inset-0 w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility =
                        "hidden";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-semibold text-gray-800 truncate"
                    style={{ direction: isRtl ? "rtl" : "ltr" }}
                  >
                    {name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ₹{book.price.toFixed(0)}
                    {book.stock <= 0
                      ? ` · ${t("outOfStock")}`
                      : ` · ${book.stock} in stock`}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    );
  };

  const renderSearchInput = (
    id: string,
    extraClass: string,
    autoFocus?: boolean
  ) => (
    <div className="relative w-full" data-search-container>
      <form className="relative w-full" onSubmit={handleSearchSubmit}>
        <input
          id={id}
          type="search"
          placeholder={isRtl ? "تلاش کریں..." : "Search products..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          className={`w-full ${
            isRtl ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
          } py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-950 focus:border-transparent transition-all ${extraClass}`}
          aria-label="Search products"
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <Search
          className={`absolute ${
            isRtl ? "right-3" : "left-3"
          } top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`}
        />
      </form>
      {renderSearchDropdown(id)}
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg"
          : "bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isRtl ? "space-x-reverse" : "space-x-8"} lg:${isRtl ? "space-x-reverse" : "space-x-12"}`}>
            <Link
              className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 hover:text-gray-700 transition-colors"
              href="/"
              aria-label="Noorani Makatib Home"
            >
              NOORANI<span className="text-primary"> MAKATIB</span>
            </Link>

            <nav
              className={`hidden md:flex items-center ${isRtl ? "space-x-reverse space-x-1" : "space-x-1"}`}
              role="navigation"
              aria-label="Main navigation"
            >
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-2 px-4 rounded-sm text-sm font-medium transition-all duration-200 ${
                    isActivePath(href)
                      ? "bg-orange-100 shadow-md text-primary"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  aria-current={isActivePath(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}

              {staffLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-2 px-4 rounded-sm text-sm font-semibold transition-all duration-200 ${
                    isActivePath(href)
                      ? "bg-primary text-primary-foreground shadow-md"
                      : href === "/packer"
                      ? "text-orange-600 hover:bg-orange-50"
                      : "text-primary hover:bg-primary/10"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex flex-1 max-w-xs mx-4">
            {renderSearchInput("header-search-desktop", "")}
          </div>

          <div className={`flex items-center ${isRtl ? "space-x-reverse space-x-2 sm:space-x-4" : "space-x-2 sm:space-x-4"}`}>
            <button
              onClick={() => setLanguage(language === "en" ? "ur" : "en")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              title="Switch Language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{language === "en" ? "اردو" : "English"}</span>
            </button>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-gray-700" />
            </button>

            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>

            <Link
              href="/cart"
              className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart className="h-6 w-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                  aria-label={`${cartCount} items in cart`}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {isSearchOpen && (
          <div className="lg:hidden mt-4 animate-in slide-in-from-top duration-200">
            {renderSearchInput("header-search-mobile", "rounded-sm", true)}
          </div>
        )}

        {isMobileOpen && (
          <nav
            className="md:hidden mt-4 animate-in slide-in-from-top duration-200"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-3 pb-4 border-b border-gray-200">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  className={`text-sm font-medium py-2 px-3 rounded-sm transition-all ${
                    isActivePath(href)
                      ? "bg-orange-100 text-primary"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  aria-current={isActivePath(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}

              {staffLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  className={`text-sm font-bold py-2 px-3 rounded-sm transition-all ${
                    isActivePath(href)
                      ? href === "/packer"
                        ? "bg-orange-500 text-white"
                        : "bg-primary text-primary-foreground"
                      : href === "/packer"
                      ? "text-orange-600 hover:bg-orange-50"
                      : "text-primary hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}