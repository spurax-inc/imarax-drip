"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/client";

const PRINTIFY_URL = "https://printify.com/app/";

type OrderRow = {
  id: string;
  reference: string;
  status: string;
  created_at: string;
  printify_order_id: string | null;
  printify_status: string | null;
  printify_error: string | null;
};

type PrintifyStatus = {
  tokenSet: boolean;
  shopIdSet: boolean;
  rateSet: boolean;
  autoProduce: boolean;
  shops: { id: number | string; title: string; sales_channel?: string }[];
  shopsError: string | null;
  orders: OrderRow[];
};

type SyncResult = {
  created: number;
  updated: number;
  skipped: number;
  notes: string[];
};

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
          ok ? "bg-signal" : "bg-gray-300"
        }`}
      >
        {ok ? "✓" : ""}
      </span>
      {label}
    </li>
  );
}

export default function PrintifyAdminPage() {
  const [supabase] = useState(() => createClient());

  const [state, setState] = useState<
    "loading" | "signedout" | "denied" | "ready"
  >("loading");
  const [info, setInfo] = useState<PrintifyStatus | null>(null);
  const [hidden, setHidden] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyOrder, setBusyOrder] = useState<string | null>(null);

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
    const res = await api("/api/admin/printify");

    if (res.status === 401 || res.status === 403) return false;

    setInfo(await res.json());

    const productsRes = await api("/api/admin/products");

    if (productsRes.ok) {
      const json = await productsRes.json();
      setHidden(
        (json.products ?? []).filter(
          (p: { is_active: boolean }) => !p.is_active
        ).length
      );
    }

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

  async function runSync() {
    setSyncing(true);
    setError("");
    setNotice("");
    setSyncResult(null);

    const res = await api("/api/admin/printify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Sync failed.");
    } else {
      setSyncResult(json.result);
    }

    await load();
    setSyncing(false);
  }

  async function publishAll() {
    if (
      !window.confirm(
        `Publish all ${hidden} hidden products now? Check their prices first.`
      )
    ) {
      return;
    }

    setPublishing(true);
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
    setPublishing(false);
  }

  async function retry(orderId: string) {
    setBusyOrder(orderId);
    setError("");

    const res = await api("/api/admin/printify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry", orderId }),
    });

    const json = await res.json();

    if (!res.ok) setError(json.error ?? "Retry failed.");

    await load();
    setBusyOrder(null);
  }

  const connected = info?.tokenSet && info.shopIdSet && info.rateSet;
  const getPrintifyStatusLabel = (status: string | null) =>
    status ? `Printify: ${status.replace(/_/g, " ")}` : "Not sent";

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <AdminNav active="/admin/printify" />

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">Printify</h1>

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
                This account does not have admin access.
              </p>
            </div>
          )}

          {state === "ready" && info && (
            <>
              {error && (
                <p className="mt-6 text-sm font-medium text-signal">{error}</p>
              )}

              {notice && (
                <p className="mt-6 text-sm font-medium text-gray-700">
                  {notice}
                </p>
              )}

              {/* IMPORT */}
              <div className="mt-8 rounded-sm border border-black/10 p-6">
                <p className="text-lg font-semibold">Import your products</p>

                <p className="mt-2 text-sm text-gray-600">
                  Two clicks: import from Printify, then publish. New products
                  arrive hidden so you can check prices first. Re-running the
                  import only refreshes pictures, sizes and colors, so your
                  prices and names stay as you set them.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runSync}
                    disabled={syncing || !connected}
                    className="rounded-full bg-signal px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {syncing ? "Importing..." : "1. Import from Printify"}
                  </button>

                  <button
                    type="button"
                    onClick={publishAll}
                    disabled={publishing || hidden === 0}
                    className="rounded-full bg-black px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-signal disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {publishing
                      ? "Publishing..."
                      : `2. Publish all hidden products (${hidden})`}
                  </button>

                  <a
                    href={PRINTIFY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-black px-8 py-3.5 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
                  >
                    Open Printify ↗
                  </a>
                </div>

                {syncResult && (
                  <div className="mt-5 rounded-sm bg-ash p-4 text-sm">
                    <p className="font-semibold">
                      Added {syncResult.created}, refreshed {syncResult.updated},
                      skipped {syncResult.skipped}.
                    </p>

                    {syncResult.notes.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
                        {syncResult.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <p className="mt-5 text-xs text-gray-500">
                  Category guesses can be wrong. Fix many at once in the{" "}
                  <Link
                    href="/admin/catalog"
                    className="font-semibold text-signal underline underline-offset-4"
                  >
                    Catalog
                  </Link>
                  : tick the products, pick a category, and click Set category.
                </p>
              </div>

              {/* CONNECTION */}
              <div className="mt-8 rounded-sm border border-black/10 p-6">
                <p className="text-lg font-semibold">Connection</p>

                <ul className="mt-5 space-y-3">
                  <Check ok={info.tokenSet} label="Printify API token added" />
                  <Check ok={info.shopIdSet} label="Printify shop ID added" />
                  <Check
                    ok={info.rateSet}
                    label="Dollar to naira rate added"
                  />
                </ul>

                <p className="mt-5 text-sm text-gray-600">
                  Automatic production:{" "}
                  <span className="font-semibold">
                    {info.autoProduce
                      ? "ON (orders go straight to production)"
                      : "OFF (you press produce in Printify)"}
                  </span>
                </p>

                {info.shopsError && (
                  <p className="mt-5 text-sm font-medium text-signal">
                    {info.shopsError}
                  </p>
                )}

                {info.shops.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Your Printify shops
                    </p>

                    <ul className="mt-3 space-y-2 text-sm">
                      {info.shops.map((shop) => (
                        <li key={String(shop.id)}>
                          <span className="font-semibold">{shop.title}</span>
                          {" · ID: "}
                          <span className="font-mono">{String(shop.id)}</span>
                          {shop.sales_channel ? ` · ${shop.sales_channel}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!info.tokenSet && (
                  <p className="mt-5 text-sm text-gray-600">
                    Not connected yet. Add your token to .env.local as
                    PRINTIFY_API_TOKEN and restart the server.
                  </p>
                )}
              </div>

              {/* ORDERS */}
              <p className="mt-14 text-xs font-semibold uppercase tracking-[0.3em] text-signal">
                Recent orders
              </p>

              {info.orders.length === 0 ? (
                <div className="mt-6 rounded-sm bg-ash p-6">
                  <p className="text-sm text-gray-500">No orders yet.</p>
                </div>
              ) : (
                <ul className="mt-6 divide-y divide-black/10 border-y border-black/10">
                  {info.orders.map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-4 py-5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{order.reference}</p>

                        <p className="mt-1 text-xs text-gray-500">
                          Payment: {order.status} ·{" "}
                          {new Date(order.created_at).toLocaleDateString("en-GB")}
                        </p>

                        {order.printify_error && (
                          <p className="mt-2 max-w-xl text-xs text-signal">
                            {order.printify_error}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                            order.printify_status === "failed"
                              ? "bg-black text-white"
                              : order.printify_status
                              ? "bg-signal text-white"
                              : "bg-ash text-gray-600"
                          }`}
                        >
                          {getPrintifyStatusLabel(order.printify_status)}
                        </span>

                        {order.printify_status === "failed" && (
                          <button
                            type="button"
                            onClick={() => retry(order.id)}
                            disabled={busyOrder === order.id}
                            className="text-sm font-semibold underline underline-offset-4 transition hover:text-signal disabled:opacity-50"
                          >
                            {busyOrder === order.id ? "Retrying..." : "Retry"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
