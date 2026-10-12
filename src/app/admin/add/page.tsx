"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/products";

type AdminProduct = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  images: unknown;
  sizes: unknown;
  colors: unknown;
  is_featured: boolean;
  is_active: boolean;
};

type AdminOrder = {
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
  order_items: {
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unit_price: number;
  }[];
};

type FormState = {
  name: string;
  category: string;
  price: string;
  description: string;
  sizes: string;
  colors: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  category: "Clothing",
  price: "",
  description: "",
  sizes: "",
  colors: "",
  images: [],
  is_featured: false,
  is_active: true,
};

const categories = ["Clothing", "Footwear", "Accessories"];

const inputClass =
  "w-full rounded-sm border border-black/20 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-signal";

const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500";

function toStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function splitList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const [supabase] = useState(() => createClient());

  const [status, setStatus] = useState<
    "loading" | "signedout" | "denied" | "ready"
  >("loading");
  const [tab, setTab] = useState<"products" | "orders">("products");

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const loadProducts = useCallback(async () => {
    const res = await api("/api/admin/products");

    if (res.status === 401 || res.status === 403) return false;

    const json = await res.json();
    setProducts(json.products ?? []);
    return true;
  }, [api]);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setStatus("signedout");
        return;
      }

      const ok = await loadProducts();
      setStatus(ok ? "ready" : "denied");
    }

    init();
  }, [supabase, loadProducts]);

  useEffect(() => {
    if (status !== "ready" || tab !== "orders") return;

    async function loadOrders() {
      setOrdersLoading(true);
      const res = await api("/api/admin/orders");
      const json = await res.json();
      setOrders(json.orders ?? []);
      setOrdersLoading(false);
    }

    loadOrders();
  }, [status, tab, api]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    const urls: string[] = [];

    for (const file of Array.from(files)) {
      const data = new FormData();
      data.append("file", file);

      const res = await api("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        break;
      }

      urls.push(json.url);
    }

    if (urls.length > 0) {
      setForm((current) => ({
        ...current,
        images: [...current.images, ...urls],
      }));
    }

    setUploading(false);
  }

  function removeImage(url: string) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((item) => item !== url),
    }));
  }

  function makeMain(url: string) {
    setForm((current) => ({
      ...current,
      images: [url, ...current.images.filter((item) => item !== url)],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      description: form.description,
      sizes: splitList(form.sizes),
      colors: splitList(form.colors),
      images: form.images,
      is_featured: form.is_featured,
      is_active: form.is_active,
    };

    const res = await api(
      editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not save the product.");
      setSaving(false);
      return;
    }

    setNotice(editingId ? "Product updated." : "Product added.");
    resetForm();
    await loadProducts();
    setSaving(false);
  }

  function handleEdit(product: AdminProduct) {
    setEditingId(product.id);
    setError("");
    setNotice("");
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      description: product.description ?? "",
      sizes: toStrings(product.sizes).join(", "),
      colors: toStrings(product.colors).join(", "),
      images: toStrings(product.images).length
        ? toStrings(product.images)
        : product.image_url
        ? [product.image_url]
        : [],
      is_featured: product.is_featured,
      is_active: product.is_active,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(product: AdminProduct) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;

    setError("");
    setNotice("");

    const res = await api(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not delete the product.");
      return;
    }

    setNotice(
      json.archived
        ? "This product already has orders, so it was hidden instead of deleted."
        : "Product deleted."
    );

    if (editingId === product.id) resetForm();
    await loadProducts();
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Manage your store
          </h1>

          <Link
            href="/admin/promotions"
            className="mt-4 inline-block rounded-full border border-black px-6 py-2.5 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
          >
            Announcement &amp; ads →
          </Link>

          {status === "loading" && (
            <p className="mt-8 text-sm text-gray-500">Loading...</p>
          )}

          {status === "signedout" && (
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

          {status === "denied" && (
            <div className="mt-8 rounded-sm bg-ash p-8">
              <p className="text-sm text-gray-600">
                This account does not have admin access. Add the account email
                to <span className="font-semibold">ADMIN_EMAILS</span> in your{" "}
                <span className="font-semibold">.env.local</span> file, then
                restart the server.
              </p>
            </div>
          )}

          {status === "ready" && (
            <>
              {/* TABS */}
              <div className="mt-8 flex gap-3">
                {(["products", "orders"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={`rounded-full border px-6 py-2.5 text-sm font-semibold capitalize transition ${
                      tab === item
                        ? "border-signal bg-signal text-white"
                        : "border-black/20 hover:border-signal"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-6 text-sm font-medium text-signal">{error}</p>
              )}

              {notice && (
                <p className="mt-6 text-sm font-medium text-gray-700">
                  {notice}
                </p>
              )}

              {/* PRODUCTS TAB */}
              {tab === "products" && (
                <>
                  <form
                    onSubmit={handleSave}
                    className="mt-8 space-y-5 rounded-sm border border-black/10 p-6"
                  >
                    <p className="text-lg font-semibold">
                      {editingId ? "Edit product" : "Add a product"}
                    </p>

                    <div>
                      <label className={labelClass}>Product name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="e.g. Imarax Core Tee"
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Category</label>
                        <select
                          value={form.category}
                          onChange={(e) => setField("category", e.target.value)}
                          className={inputClass}
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Price (NGN)</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={form.price}
                          onChange={(e) => setField("price", e.target.value)}
                          placeholder="e.g. 18000"
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        rows={4}
                        placeholder="Tell customers about this product"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          Sizes (separate with commas)
                        </label>
                        <input
                          type="text"
                          value={form.sizes}
                          onChange={(e) => setField("sizes", e.target.value)}
                          placeholder="S, M, L, XL"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Colors (separate with commas)
                        </label>
                        <input
                          type="text"
                          value={form.colors}
                          onChange={(e) => setField("colors", e.target.value)}
                          placeholder="Black, White"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Pictures</label>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          handleUpload(e.target.files);
                          e.target.value = "";
                        }}
                        className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-white"
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        Each picture under 4 MB. The first picture is the main
                        one.
                      </p>

                      {uploading && (
                        <p className="mt-3 text-sm text-gray-500">
                          Uploading...
                        </p>
                      )}

                      {form.images.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-4">
                          {form.images.map((url, index) => (
                            <div key={url} className="w-24">
                              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#ececec]">
                                <img
                                  src={url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />

                                {index === 0 && (
                                  <span className="absolute left-1 top-1 rounded-full bg-signal px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                                    Main
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex justify-between text-[11px]">
                                {index !== 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => makeMain(url)}
                                    className="font-semibold underline underline-offset-2 transition hover:text-signal"
                                  >
                                    Make main
                                  </button>
                                ) : (
                                  <span />
                                )}

                                <button
                                  type="button"
                                  onClick={() => removeImage(url)}
                                  className="text-gray-500 underline underline-offset-2 transition hover:text-signal"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-8">
                      <label className="flex items-center gap-3 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={form.is_featured}
                          onChange={(e) =>
                            setField("is_featured", e.target.checked)
                          }
                          className="h-4 w-4 accent-[#d2561f]"
                        />
                        Featured on the home page
                      </label>

                      <label className="flex items-center gap-3 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) =>
                            setField("is_active", e.target.checked)
                          }
                          className="h-4 w-4 accent-[#d2561f]"
                        />
                        Visible in the shop
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={saving || uploading}
                        className="rounded-full bg-signal px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-60"
                      >
                        {saving
                          ? "Saving..."
                          : editingId
                          ? "Save changes"
                          : "Add product"}
                      </button>

                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-full border border-black px-8 py-3.5 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* PRODUCT LIST */}
                  <p className="mt-14 text-xs font-semibold uppercase tracking-[0.3em] text-signal">
                    Your products ({products.length})
                  </p>

                  {products.length === 0 ? (
                    <div className="mt-6 rounded-sm bg-ash p-6">
                      <p className="text-sm text-gray-500">
                        No products yet. Add your first one above.
                      </p>
                    </div>
                  ) : (
                    <ul className="mt-6 divide-y divide-black/10 border-y border-black/10">
                      {products.map((product) => {
                        const thumb =
                          toStrings(product.images)[0] ?? product.image_url;

                        return (
                          <li
                            key={product.id}
                            className="flex flex-wrap items-center gap-5 py-5"
                          >
                            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-[#ececec]">
                              {thumb && (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{product.name}</p>

                              <p className="mt-1 text-sm text-gray-500">
                                {product.category} ·{" "}
                                {formatPrice(
                                  Number(product.price),
                                  product.currency
                                )}
                              </p>

                              <div className="mt-2 flex gap-2">
                                {product.is_featured && (
                                  <span className="rounded-full bg-signal px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                    Featured
                                  </span>
                                )}

                                {!product.is_active && (
                                  <span className="rounded-full bg-ash px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                                    Hidden
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-4 text-sm">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="font-semibold underline underline-offset-4 transition hover:text-signal"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(product)}
                                className="text-gray-500 underline underline-offset-4 transition hover:text-signal"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}

              {/* ORDERS TAB */}
              {tab === "orders" && (
                <div className="mt-8">
                  {ordersLoading ? (
                    <p className="text-sm text-gray-500">Loading orders...</p>
                  ) : orders.length === 0 ? (
                    <div className="rounded-sm bg-ash p-6">
                      <p className="text-sm text-gray-500">No orders yet.</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {orders.map((order) => (
                        <li
                          key={order.id}
                          className="rounded-sm border border-black/10 p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              {order.reference}
                            </p>

                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                                order.status === "paid"
                                  ? "bg-signal text-white"
                                  : "bg-ash text-gray-600"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleString("en-GB")}
                          </p>

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
                                {[item.size, item.color].filter(Boolean)
                                  .length > 0 &&
                                  ` (${[item.size, item.color]
                                    .filter(Boolean)
                                    .join(" / ")})`}
                              </li>
                            ))}
                          </ul>

                          <p className="mt-4 text-sm font-bold">
                            {formatPrice(Number(order.subtotal), order.currency)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}