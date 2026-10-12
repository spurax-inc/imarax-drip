"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/client";

const PRINTIFY_URL = "https://printify.com/app/";

type ProductRow = {
  id: string;
  is_active: boolean;
  track_stock: boolean;
  stock: number;
};

type OrderRow = {
  status: string;
  fulfilment_status: string | null;
  printify_status: string | null;
};

const tiles = [
  {
    href: "/admin/catalog",
    title: "Catalog",
    text: "Publish many products at once, set category, source and stock.",
  },
  {
    href: "/admin/add",
    title: "Add a product",
    text: "Add or edit a single product with its pictures.",
  },
  {
    href: "/admin/orders",
    title: "Fulfilment",
    text: "Orders to pack and ship, with tracking notes.",
  },
  {
    href: "/admin/printify",
    title: "Printify",
    text: "Import your Printify products and check order status.",
  },
  {
    href: "/admin/promotions",
    title: "Announcement & ads",
    text: "The orange top bar and sponsored banners.",
  },
];

export default function AdminHome() {
  const [supabase] = useState(() => createClient());

  const [state, setState] = useState<
    "loading" | "signedout" | "denied" | "ready"
  >("loading");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers(init.headers);

      if (token) headers.set("Authorization", `Bearer ${token}`);

      return fetch(path, { ...init, headers });
    },
    [supabase]
  );

  const load = useCallback(async () => {
    const [productsRes, ordersRes] = await Promise.all([
      api("/api/admin/products"),
      api("/api/admin/orders"),
    ]);

    if (
      productsRes.status === 401 ||
      productsRes.status === 403 ||
      ordersRes.status === 401 ||
      ordersRes.status === 403
    ) {
      return false;
    }

    const productsJson = await productsRes.json();
    const ordersJson = await ordersRes.json();

    setProducts(productsJson.products ?? []);
    setOrders(ordersJson.orders ?? []);

    return true;
  }, [api]);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setState("signedout");
        return;
      }

      const ok = await load();
      setState(ok ? "ready" : "denied");
    }

    init();
  }, [supabase, load]);

  const live = products.filter((p) => p.is_active).length;
  const hidden = products.filter((p) => !p.is_active).length;
  const soldOut = products.filter(
    (p) => p.is_active && p.track_stock && p.stock <= 0
  ).length;

  const toFulfil = orders.filter(
    (o) =>
      o.status === "paid" &&
      ["new", "packed"].includes(o.fulfilment_status ?? "new")
  ).length;

  const printifyFailed = orders.filter(
    (o) => o.printify_status === "failed"
  ).length;

  async function publishAllHidden() {
    if (
      !window.confirm(
        `Publish all ${hidden} hidden products? Check their prices first.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    const res = await api("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "all_hidden",
        values: { is_active: true },
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not publish.");
    } else {
      setNotice(`Published ${json.updated} products. They are now in the shop.`);
    }

    await load();
    setBusy(false);
  }

  const statClass =
    "block rounded-sm border border-black/10 p-5 transition hover:border-signal";

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <AdminNav active="/admin" />

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">Dashboard</h1>

          {state === "loading" && (
            <p className="mt-8 text-sm text-gray-500">Loading...</p>
          )}

          {state === "signedout" && (
            <div className="mt-8 rounded-sm bg-ash p-8">
              <p className="text-sm text-gray-600">
                Please sign in with your admin account first.
              </p>

              <Link
                href="/account"
                className="mt-6 inline-block rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-signal-dark"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {state === "denied" && (
            <div className="mt-8 rounded-sm bg-ash p-8">
              <p className="text-sm text-gray-600">
                This account does not have admin access. Add the account email
                to <span className="font-semibold">ADMIN_EMAILS</span> in your{" "}
                <span className="font-semibold">.env.local</span> file, then
                restart the server.
              </p>
            </div>
          )}

          {state === "ready" && (
            <>
              {error && (
                <p className="mt-6 text-sm font-medium text-signal">{error}</p>
              )}

              {notice && (
                <p className="mt-6 text-sm font-medium text-gray-700">
                  {notice}
                </p>
              )}

              {/* AT A GLANCE */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/catalog" className={statClass}>
                  <p className="text-3xl font-bold">{live}</p>
                  <p className="mt-1 text-sm text-gray-600">Products live</p>
                </Link>

                <Link href="/admin/catalog" className={statClass}>
                  <p
                    className={`text-3xl font-bold ${
                      hidden > 0 ? "text-signal" : ""
                    }`}
                  >
                    {hidden}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Hidden, waiting to publish
                  </p>
                </Link>

                <Link href="/admin/orders" className={statClass}>
                  <p
                    className={`text-3xl font-bold ${
                      toFulfil > 0 ? "text-signal" : ""
                    }`}
                  >
                    {toFulfil}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">Orders to ship</p>
                </Link>

                <Link href="/admin/printify" className={statClass}>
                  <p
                    className={`text-3xl font-bold ${
                      printifyFailed > 0 ? "text-signal" : ""
                    }`}
                  >
                    {printifyFailed}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Printify orders failed
                  </p>
                </Link>
              </div>

              {soldOut > 0 && (
                <p className="mt-4 text-sm text-gray-600">
                  {soldOut} live product{soldOut === 1 ? " is" : "s are"} sold
                  out. <Link href="/admin/catalog" className="font-semibold text-signal underline underline-offset-4">Review stock</Link>
                </p>
              )}

              {/* QUICK ACTION */}
              {hidden > 0 && (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-ash p-5">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{hidden}</span> product
                    {hidden === 1 ? " is" : "s are"} hidden. Publish them all in
                    one click.
                  </p>

                  <button
                    type="button"
                    onClick={publishAllHidden}
                    disabled={busy}
                    className="rounded-full bg-signal px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-50"
                  >
                    {busy ? "Publishing..." : "Publish all hidden products"}
                  </button>
                </div>
              )}

              {/* SECTIONS */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tiles.map((tile) => (
                  <Link
                    key={tile.href}
                    href={tile.href}
                    className="group rounded-sm border-t-4 border-transparent bg-ash p-6 transition hover:-translate-y-1 hover:border-signal hover:shadow-lg"
                  >
                    <p className="text-lg font-semibold">{tile.title}</p>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {tile.text}
                    </p>

                    <span className="mt-5 inline-block text-sm font-semibold text-signal underline underline-offset-4">
                      Open →
                    </span>
                  </Link>
                ))}

                <a
                  href={PRINTIFY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-sm border-t-4 border-transparent bg-black p-6 text-white transition hover:-translate-y-1 hover:border-signal hover:shadow-lg"
                >
                  <p className="text-lg font-semibold">Open Printify ↗</p>

                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    Go to your Printify dashboard in a new tab.
                  </p>

                  <span className="mt-5 inline-block text-sm font-semibold text-signal underline underline-offset-4">
                    Go to Printify →
                  </span>
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}