"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/products";

type Row = {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image_url: string | null;
  images: unknown;
  is_active: boolean;
  is_featured: boolean;
  source: string | null;
  track_stock: boolean;
  stock: number;
};

type Filter = "all" | "hidden" | "visible" | "soldout";

const categories = ["Clothing", "Footwear", "Accessories"];

const smallInput =
  "rounded-sm border border-black/20 bg-white px-3 py-2 text-sm outline-none transition focus:border-signal";

function toStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export default function CatalogPage() {
  const [supabase] = useState(() => createClient());

  const [state, setState] = useState<
    "loading" | "signedout" | "denied" | "ready"
  >("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [bulkCategory, setBulkCategory] = useState("Clothing");
  const [bulkSource, setBulkSource] = useState("");
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
    const res = await api("/api/admin/products");

    if (res.status === 401 || res.status === 403) return false;

    const json = await res.json();
    setRows(json.products ?? []);
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

  async function apply(
    values: Record<string, unknown>,
    ids: string[],
    label: string,
    scope?: "all_hidden"
  ) {
    setBusy(true);
    setError("");
    setNotice("");

    const res = await api("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, scope, values }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not save.");
    } else {
      setNotice(
        `${label} (${json.updated} product${json.updated === 1 ? "" : "s"}).`
      );
    }

    await load();
    setBusy(false);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (filter === "hidden" && row.is_active) return false;
      if (filter === "visible" && !row.is_active) return false;
      if (filter === "soldout" && !(row.track_stock && row.stock <= 0)) {
        return false;
      }

      if (term) {
        const text = `${row.name} ${row.source ?? ""}`.toLowerCase();
        if (!text.includes(term)) return false;
      }

      return true;
    });
  }, [rows, filter, search]);

  const hiddenCount = rows.filter((row) => !row.is_active).length;
  const picked = [...selected].filter((id) => rows.some((row) => row.id === id));
  const allTicked =
    filtered.length > 0 && filtered.every((row) => selected.has(row.id));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);

      if (allTicked) {
        filtered.forEach((row) => next.delete(row.id));
      } else {
        filtered.forEach((row) => next.add(row.id));
      }

      return next;
    });
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <AdminNav active="/admin/catalog" />

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">Catalog</h1>

          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Everything you sell in one list. Tick products to publish, hide or
            change them in bulk, or edit the category, source, stock and
            visibility straight in the row. Only you can see the source.
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

              {/* TOP TOOLBAR */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {(
                  [
                    ["all", "All"],
                    ["hidden", "Hidden"],
                    ["visible", "Visible"],
                    ["soldout", "Sold out"],
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

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or source"
                  className={`${smallInput} ml-auto w-full sm:w-64`}
                />
              </div>

              {hiddenCount > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-ash p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{hiddenCount}</span> hidden
                    product{hiddenCount === 1 ? "" : "s"} waiting to be
                    published.
                  </p>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Publish all ${hiddenCount} hidden products? Check their prices first.`
                        )
                      ) {
                        apply({ is_active: true }, [], "Published", "all_hidden");
                      }
                    }}
                    className="rounded-full bg-signal px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-50"
                  >
                    Publish all hidden
                  </button>
                </div>
              )}

              {/* BULK BAR */}
              {picked.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-sm border border-signal p-4">
                  <p className="text-sm font-semibold">
                    {picked.length} selected
                  </p>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => apply({ is_active: true }, picked, "Published")}
                    className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-50"
                  >
                    Publish
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => apply({ is_active: false }, picked, "Hidden")}
                    className="rounded-full border border-black px-4 py-2 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white disabled:opacity-50"
                  >
                    Hide
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      apply({ is_featured: true }, picked, "Featured")
                    }
                    className="rounded-full border border-black px-4 py-2 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white disabled:opacity-50"
                  >
                    Feature
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      apply({ is_featured: false }, picked, "Unfeatured")
                    }
                    className="rounded-full border border-black px-4 py-2 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white disabled:opacity-50"
                  >
                    Unfeature
                  </button>

                  <span className="mx-1 hidden h-6 w-px bg-black/10 sm:block" />

                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className={smallInput}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      apply({ category: bulkCategory }, picked, "Category set")
                    }
                    className="rounded-full border border-black px-4 py-2 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white disabled:opacity-50"
                  >
                    Set category
                  </button>

                  <input
                    type="text"
                    value={bulkSource}
                    onChange={(e) => setBulkSource(e.target.value)}
                    placeholder="Source, e.g. Own stock"
                    className={`${smallInput} w-44`}
                  />

                  <button
                    type="button"
                    disabled={busy || bulkSource.trim() === ""}
                    onClick={() =>
                      apply({ source: bulkSource }, picked, "Source set")
                    }
                    className="rounded-full border border-black px-4 py-2 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white disabled:opacity-50"
                  >
                    Set source
                  </button>
                </div>
              )}

              {/* LIST */}
              {filtered.length === 0 ? (
                <div className="mt-8 rounded-sm bg-ash p-6">
                  <p className="text-sm text-gray-500">No products found.</p>
                </div>
              ) : (
                <>
                  <label className="mt-8 flex items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={allTicked}
                      onChange={toggleAll}
                      className="h-4 w-4 accent-[#d2561f]"
                    />
                    Select all shown ({filtered.length})
                  </label>

                  <ul className="mt-4 divide-y divide-black/10 border-y border-black/10">
                    {filtered.map((row) => {
                      const thumb = toStrings(row.images)[0] ?? row.image_url;

                      return (
                        <li
                          key={row.id}
                          className="flex flex-wrap items-center gap-4 py-4"
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => toggle(row.id)}
                            aria-label={`Select ${row.name}`}
                            className="h-4 w-4 accent-[#d2561f]"
                          />

                          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-[#ececec]">
                            {thumb && (
                              <img
                                src={thumb}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-[10rem] flex-1">
                            <p className="font-semibold">{row.name}</p>

                            <p className="mt-0.5 text-sm text-gray-500">
                              {formatPrice(Number(row.price), row.currency)}
                            </p>
                          </div>

                          <select
                            value={row.category}
                            disabled={busy}
                            onChange={(e) =>
                              apply(
                                { category: e.target.value },
                                [row.id],
                                "Category updated"
                              )
                            }
                            className={smallInput}
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>

                          <input
                            key={`${row.id}-source-${row.source}`}
                            type="text"
                            defaultValue={row.source ?? ""}
                            aria-label="Source"
                            placeholder="Source"
                            onBlur={(e) => {
                              const value = e.target.value.trim();

                              if (value && value !== (row.source ?? "")) {
                                apply({ source: value }, [row.id], "Source updated");
                              }
                            }}
                            className={`${smallInput} w-32`}
                          />

                          <label className="flex items-center gap-2 text-xs font-medium">
                            <input
                              type="checkbox"
                              checked={row.track_stock}
                              disabled={busy}
                              onChange={(e) =>
                                apply(
                                  { track_stock: e.target.checked },
                                  [row.id],
                                  "Stock tracking updated"
                                )
                              }
                              className="h-4 w-4 accent-[#d2561f]"
                            />
                            Track stock
                          </label>

                          {row.track_stock && (
                            <input
                              key={`${row.id}-stock-${row.stock}`}
                              type="number"
                              min="0"
                              defaultValue={row.stock}
                              aria-label="Stock"
                              onBlur={(e) => {
                                const value = Number(e.target.value);

                                if (
                                  Number.isInteger(value) &&
                                  value >= 0 &&
                                  value !== row.stock
                                ) {
                                  apply({ stock: value }, [row.id], "Stock updated");
                                }
                              }}
                              className={`${smallInput} w-20`}
                            />
                          )}

                          <label className="flex items-center gap-2 text-xs font-medium">
                            <input
                              type="checkbox"
                              checked={row.is_active}
                              disabled={busy}
                              onChange={(e) =>
                                apply(
                                  { is_active: e.target.checked },
                                  [row.id],
                                  e.target.checked ? "Published" : "Hidden"
                                )
                              }
                              className="h-4 w-4 accent-[#d2561f]"
                            />
                            Visible
                          </label>

                          <label className="flex items-center gap-2 text-xs font-medium">
                            <input
                              type="checkbox"
                              checked={row.is_featured}
                              disabled={busy}
                              onChange={(e) =>
                                apply(
                                  { is_featured: e.target.checked },
                                  [row.id],
                                  e.target.checked ? "Featured" : "Unfeatured"
                                )
                              }
                              className="h-4 w-4 accent-[#d2561f]"
                            />
                            Featured
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}