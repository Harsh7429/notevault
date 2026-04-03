import Link from "next/link";
import { motion, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { clearStoredToken, getStoredToken } from "@/lib/auth";

const guestNavItems = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse Notes" },
  { href: "/register", label: "Register" },
  { href: "/login", label: "Login" }
];

const signedInNavItems = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse Notes" },
  { href: "/dashboard", label: "My Library" }
];

export function Navbar({ scrollYProgress }) {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const background = useTransform(scrollYProgress, [0, 0.08], ["rgba(246,241,232,0.72)", "rgba(246,241,232,0.9)"]);
  const borderColor = useTransform(scrollYProgress, [0, 0.08], ["rgba(22,22,22,0.08)", "rgba(22,22,22,0.12)"]);
  const shadow = useTransform(scrollYProgress, [0, 0.08], ["0 0 0 rgba(0,0,0,0)", "0 16px 48px rgba(49,45,38,0.08)"]);

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
    <motion.header
      style={{ background, borderColor, boxShadow: shadow }}
      className="fixed inset-x-0 top-0 z-50 mx-auto mt-4 w-[min(1220px,calc(100%-2rem))] rounded-[1.75rem] border px-4 py-3 backdrop-blur-xl md:rounded-full md:px-5"
    >
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex flex-col">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.38em] text-[#1b1b18]">NoteVault</span>
          <span className="text-[0.62rem] uppercase tracking-[0.28em] text-[#6d675c]">Secure notes marketplace</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/browse" className="rounded-full px-4 py-2 text-sm font-medium text-[#3e3a33] transition hover:bg-white/50 hover:text-[#11110f]">
            Browse Notes
          </Link>
          {hasToken ? (
            <>
              <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm font-medium text-[#3e3a33] transition hover:bg-white/50 hover:text-[#11110f]">
                My Library
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[#171511]/12 bg-[#171511] px-4 py-2 text-sm font-medium text-[#f8f4ee] transition hover:bg-[#2a251d]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/register" className="rounded-full px-4 py-2 text-sm font-medium text-[#3e3a33] transition hover:bg-white/50 hover:text-[#11110f]">
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-[#171511]/12 bg-[#171511] px-4 py-2 text-sm font-medium text-[#f8f4ee] transition hover:bg-[#2a251d]"
              >
                Login
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex items-center justify-center rounded-full border border-[#171511]/10 bg-white/80 p-2 text-[#171511] transition hover:bg-white md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="mt-4 grid gap-2 rounded-[1.4rem] border border-[#171511]/8 bg-white/85 p-3 shadow-[0_18px_40px_rgba(49,45,38,0.08)] md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-[1rem] px-4 py-3 text-sm font-medium text-[#3e3a33] transition hover:bg-[#f5efe5] hover:text-[#11110f]"
            >
              {item.label}
            </Link>
          ))}
          {hasToken ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-[1rem] bg-[#171511] px-4 py-3 text-left text-sm font-medium text-[#f8f4ee] transition hover:bg-[#2a251d]"
            >
              Logout
            </button>
          ) : null}
        </div>
      ) : null}
    </motion.header>
  );
}
