"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/products";

type Item = {
  name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  printify_product_id: string | null;
};

type Order = {
  id: string;
  reference: string;
  status: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  subtotal: number;
  currency: string;
  created_at: string;
  fulfilment_status: string;
  tracking_note: string | null;
  printify_order_id: string | null;
  printify_status: string | null;
  printify_error: string | null;
  order_items: Item[];
};

type Filter = "action" | "shipped" | "delivered" | "unpaid" | "all";

const steps = [
  { value: "new", label: "New" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

const smallInput =
  "rounded-sm border border-black/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-signal";

export default function FulfilmentPage() {
  const [supabase] = useState(() => createClient());

  const [state, setState] = useState<
    "loading" | "signedout" | "denied" | "ready"
  >("loading");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("action");
  const [drafts, setDrafts] = useState<
    Record<string, { status: string; tracking: string }>
  >({});
  const [busyId, setBusyId] = useState<string | null>(null);
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
    const res = await api("/api/admin/orders");

    if (res.status === 401 || res.status === 403) return false;

    const json = await res.json();
    const list: Order[] = json.orders ?? [];

    setOrders(list);
    setDrafts(
      Object.fromEntries(
        list.map((order) => [
          order.id,
          {
            status: order.fulfilment_status ?? "new",
            tracking: order.tracking_note ?? "",
          },
        ])
      )
    );

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

  async function save(order: Order) {
    const draft = drafts[order.id];
    if (!draft) return;

    setBusyId(order.id);
    setError("");
    setNotice("");

    const res = await api("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: order.id,
        fulfilment_status: draft.status,
        tracking_note: draft.tracking,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not save.");
    } else {
      setNotice(
        json.emailSent
          ? `${order.reference} saved. The customer was emailed.`
          : `${order.reference} saved.`
      );
      await load();
    }

    setBusyId(null);
  }

  const visible = useMemo(() => {
    return orders.filter((order) => {
      const paid = order.status === "paid";

      if (filter === "action") {
        return paid && ["new", "packed"].includes(order.fulfilment_status);
      }
      if (filter === "shipped") return paid && order.fulfilment_status === "shipped";
      if (filter === "delivered") {
        return paid && order.fulfilment_status === "delivered";
      }
      if (filter === "unpaid") return !paid;

      return true;
    });
  }, [orders, filter]);

  const actionCount = orders.filter(
    (order) =>
      order.status === "paid" &&
      ["new", "packed"].includes(order.fulfilment_status)
  ).length;

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <AdminNav active="/admin/orders" />

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">Fulfilment</h1>

          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Paid orders that need you. Set the status and add a tracking note.
            When you mark an order Shipped, the customer is emailed (once email
            is set up).
          </p>

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

              <div className="mt-8 flex flex-wrap gap-3">
                {(
                  [
                    ["action", `Needs action (${actionCount})`],
                    ["shipped", "Shipped"],
                    ["delivered", "Delivered"],
                    ["unpaid", "Unpaid"],
                    ["all", "All"],
                  ] as [Filter, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                      filter === value
                        ? "border-signal bg-signal text-white"
                        : "border-black/20 hover:border-signal"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {visible.length === 0 ? (
                <div className="mt-8 rounded-sm bg-ash p-6">
                  <p className="text-sm text-gray-500">
                    Nothing here. Good work.
                  </p>
                </div>
              ) : (
                <ul className="mt-8 space-y-4">
                  {visible.map((order) => {
                    const draft = drafts[order.id] ?? {
                      status: order.fulfilment_status,
                      tracking: order.tracking_note ?? "",
                    };

                    const hasPrintify = order.order_items.some(
                      (item) => item.printify_product_id
                    );
                    const hasOwn = order.order_items.some(
                      (item) => !item.printify_product_id
                    );
                    const paid = order.status === "paid";

                    return (
                      <li
                        key={order.id}
                        className="rounded-sm border border-black/10 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {order.reference}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {!paid && (
                              <span className="rounded-full bg-ash px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                                {order.status}
                              </span>
                            )}

                            {hasPrintify && (
                              <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                                Printify
                                {order.printify_status
                                  ? `: ${order.printify_status.replace("_", " ")}`
                                  : ": not sent"}
                              </span>
                            )}

                            {hasOwn && (
                              <span className="rounded-full bg-signal px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                                You ship this
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString("en-GB")}
                        </p>

                        {order.printify_error && (
                          <p className="mt-2 text-xs text-signal">
                            Printify: {order.printify_error}
                          </p>
                        )}

                        <p className="mt-4 text-sm font-medium">
                          {order.full_name}
                        </p>

                        <p className="text-sm text-gray-600">
                          {order.email} · {order.phone}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {order.address}, {order.city}, {order.state},{" "}
                          {order.country}
                        </p>

                        <ul className="mt-4 space-y-1 text-sm text-gray-600">
                          {order.order_items.map((item, index) => (
                            <li key={index}>
                              {item.name} × {item.quantity}
                              {[item.size, item.color].filter(Boolean).length >
                                0 &&
                                ` (${[item.size, item.color]
                                  .filter(Boolean)
                                  .join(" / ")})`}
                              {item.printify_product_id ? " · Printify" : " · yours"}
                            </li>
                          ))}
                        </ul>

                        <p className="mt-3 text-sm font-bold">
                          {formatPrice(Number(order.subtotal), order.currency)}
                        </p>

                        {paid && (
                          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-black/10 pt-5">
                            <select
                              value={draft.status}
                              onChange={(e) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [order.id]: { ...draft, status: e.target.value },
                                }))
                              }
                              className={smallInput}
                            >
                              {steps.map((step) => (
                                <option key={step.value} value={step.value}>
                                  {step.label}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={draft.tracking}
                              onChange={(e) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [order.id]: {
                                    ...draft,
                                    tracking: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Tracking note, e.g. courier and number"
                              className={`${smallInput} min-w-[14rem] flex-1`}
                            />

                            <button
                              type="button"
                              disabled={busyId === order.id}
                              onClick={() => save(order)}
                              className="rounded-full bg-signal px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-50"
                            >
                              {busyId === order.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
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