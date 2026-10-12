"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import AnnouncementBar from "./AnnouncementBar";
import InstallApp from "./InstallApp";
import { CART_EVENT, getCartCount } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#collections", label: "Collections" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const update = () => setCount(getCartCount());

    update();
    window.addEventListener(CART_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(CART_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function check(token: string | null) {
      if (!token) {
        setIsAdmin(false);
        return;
      }

      try {
        const res = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAdmin(res.ok);
      } catch {
        setIsAdmin(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      check(data.session?.access_token ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        check(session?.access_token ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-50 border-b border-t-2 border-black/10 border-t-signal bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium transition hover:text-signal"
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin/catalog"
                className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-signal"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="hidden rounded-full border border-black px-5 py-2.5 text-sm font-semibold text-black transition hover:border-signal hover:bg-signal hover:text-white sm:inline-block"
            >
              Account
            </Link>

            <Link
              href="/cart"
              className="rounded-full bg-signal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-dark sm:px-5"
            >
              Cart{count > 0 ? ` (${count})` : ""}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20 transition hover:border-signal md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-black/10 bg-white px-6 py-4 md:hidden">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-base font-semibold transition hover:text-signal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              <li>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base font-semibold transition hover:text-signal"
                >
                  Account
                </Link>
              </li>

              {isAdmin && (
                <li>
                  <Link
                    href="/admin/catalog"
                    onClick={() => setOpen(false)}
                    className="block py-3 text-base font-semibold text-signal"
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>

            <div className="mt-3 pb-2">
              <InstallApp />
            </div>
          </nav>
        )}
      </header>
    </>
  );
}