import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { clearStoredToken, getStoredToken } from "@/lib/auth";

const guestNavItems = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse Notes" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

const signedInNavItems = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse Notes" },
  { href: "/dashboard", label: "My Library" },
];

export function AppShell({ children }) {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getStoredToken()));
    setMenuOpen(false);
  }, [router.asPath]);

  const navItems = useMemo(() => (hasToken ? signedInNavItems : guestNavItems), [hasToken]);

  function handleLogout() {
    clearStoredToken();
    setHasToken(false);
    setMenuOpen(false);
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#161616]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(232,218,194,0.6),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(220,228,211,0.55),_transparent_26%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 soft-grid opacity-50" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-5 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="sticky top-3 z-30 mb-6 rounded-[1.5rem] border border-[#171511]/10 bg-[rgba(246,241,232,0.92)] px-4 py-3 shadow-[0_18px_44px_rgba(76,63,43,0.08)] backdrop-blur-xl sm:top-5 sm:mb-8 sm:rounded-full"
        >
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-[#171511] sm:text-xl">NoteVault</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#7a7368] sm:text-[11px]">Secure notes marketplace</span>
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
              {hasToken ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 rounded-full border border-[#171511]/10 bg-[#171511] px-4 py-2 text-sm font-medium text-[#f8f4ee] transition hover:bg-[#2a251d]"
                >
                  Logout
                </button>
              ) : null}
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-full border border-[#171511]/10 bg-white/80 p-2 text-[#171511] transition hover:bg-white md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen ? (
            <div className="mt-3 grid gap-1 rounded-[1.2rem] border border-[#171511]/8 bg-white/90 p-2 shadow-[0_18px_40px_rgba(49,45,38,0.1)] md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-[0.9rem] px-4 py-3 text-sm font-medium text-[#4f493e] transition hover:bg-[#f5efe5] hover:text-[#171511] active:bg-[#ede5d8]"
                >
                  {item.label}
                </Link>
              ))}
              {hasToken ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-[0.9rem] bg-[#171511] px-4 py-3 text-left text-sm font-medium text-[#f8f4ee] transition hover:bg-[#2a251d]"
                >
                  Logout
                </button>
              ) : null}
            </div>
          ) : null}
        </motion.header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
