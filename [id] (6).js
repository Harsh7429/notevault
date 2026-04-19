import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { clearStoredToken, getStoredToken } from "@/lib/auth";

const guestNavItems = [
  { href: "/",         label: "Home" },
  { href: "/browse",   label: "Browse Notes" },
  { href: "/login",    label: "Login" },
  { href: "/register", label: "Register" },
];

const signedInNavItems = [
  { href: "/",          label: "Home" },
  { href: "/browse",    label: "Browse Notes" },
  { href: "/dashboard", label: "My Library" },
];

export function AppShell({ children }) {
  const router   = useRouter();
  const [hasToken,  setHasToken]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getStoredToken()));
    setMenuOpen(false);
  }, [router.asPath]);

  const navItems = useMemo(
    () => (hasToken ? signedInNavItems : guestNavItems),
    [hasToken]
  );

  function handleLogout() {
    clearStoredToken();
    setHasToken(false);
    setMenuOpen(false);
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(232,218,194,0.6),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(220,228,211,0.55),_transparent_26%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 soft-grid opacity-50" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-3 sm:px-6 sm:pb-12 sm:pt-4 lg:px-10">
        {/* ── Sticky header ── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="sticky top-2 z-30 mb-5 rounded-2xl border border-[#171511]/10 bg-[rgba(246,241,232,0.95)] px-4 py-2.5 shadow-[0_8px_32px_rgba(76,63,43,0.08)] backdrop-blur-xl sm:top-4 sm:mb-7 sm:rounded-full sm:py-3"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link href="/" className="flex flex-col min-h-0">
              <span className="text-sm font-semibold tracking-tight text-[#171511] sm:text-base">
                NoteVault
              </span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-[#7a7368] sm:text-[10px]">
                Secure notes marketplace
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#4f493e] transition hover:bg-white/65 hover:text-[#171511]"
                >
                  {item.label}
                </Link>
              ))}
              {hasToken && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 rounded-full border border-[#171511]/10 bg-[#171511] px-4 py-2 text-sm font-medium text-[#f8f4ee] transition hover:bg-[#2a251d]"
                >
                  Logout
                </button>
              )}
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-[#171511]/10 bg-white/80 text-[#171511] transition hover:bg-white md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="mt-2.5 grid gap-1 rounded-2xl border border-[#171511]/8 bg-white/95 p-2 shadow-[0_12px_32px_rgba(49,45,38,0.1)] md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-[#4f493e] transition hover:bg-[#f5efe5] hover:text-[#171511] active:bg-[#ede5d8]"
                >
                  {item.label}
                </Link>
              ))}
              {hasToken && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-[#171511] px-4 py-3 text-left text-sm font-medium text-[#f8f4ee] transition hover:bg-[#2a251d]"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </motion.header>

        <main className="flex-1">{children}</main>

        {/* Bottom safe-area padding for iOS home bar */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
